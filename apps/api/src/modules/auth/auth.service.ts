import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  ServiceUnavailableException,
  Logger,
  Inject,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { Role } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditQueueService } from '../../common/events/audit-queue.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RecentUserHintDto } from './dto/recent-user-hints.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { AuditOperation } from '../audit/dto/create-audit-log.dto';
import { ErrorCodes } from '../../common/errors/error-codes';

const REFRESH_TOKEN_BLACKLIST_PREFIX = 'refresh:blacklist:';
const DEFAULT_ACCESS_EXPIRES_IN = '15m';
const DEFAULT_REFRESH_EXPIRES_IN = '7d';

interface AuthUserProfile {
  id: string;
  username: string;
  firstName: string;
  surname: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  avatarColor?: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;
}

interface AuditRequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditQueue: AuditQueueService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis | null,
  ) {}

  async login(dto: LoginDto, meta?: AuditRequestMeta): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      select: {
        id: true,
        username: true,
        password: true,
        firstName: true,
        surname: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        avatarColor: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      this.auditQueue.push({
        entity: 'Auth',
        entityId: dto.username,
        operation: AuditOperation.LOGIN_FAILED,
        newValue: { username: dto.username, reason: 'USER_NOT_FOUND' },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      });
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_USER_NOT_FOUND,
        message: 'User not found',
      });
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      this.auditQueue.push({
        userId: user.id,
        entity: 'Auth',
        entityId: user.id,
        operation: AuditOperation.LOGIN_FAILED,
        newValue: { username: user.username, reason: 'INVALID_PASSWORD' },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      });
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_INVALID_PASSWORD,
        message: 'Invalid password',
      });
    }

    if (!user.isActive) {
      this.auditQueue.push({
        userId: user.id,
        entity: 'Auth',
        entityId: user.id,
        operation: AuditOperation.LOGIN_FAILED,
        newValue: { username: user.username, reason: 'USER_DISABLED' },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      });
      throw new ForbiddenException({
        code: ErrorCodes.AUTH_USER_DISABLED,
        message: 'User account is disabled',
      });
    }

    const loggedInAt = new Date();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: loggedInAt,
      },
    });

    this.auditQueue.push({
      userId: user.id,
      entity: 'Auth',
      entityId: user.id,
      operation: AuditOperation.LOGIN_SUCCESS,
      newValue: { username: user.username },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return this.issueTokens({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      surname: user.surname,
      role: user.role,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      avatarColor: user.avatarColor,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: loggedInAt,
    });
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const payload = this.verifyRefreshToken(refreshToken);

    const isBlacklisted = await this.isTokenBlacklisted(refreshToken);
    if (isBlacklisted) {
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_REFRESH_REVOKED,
        message: 'Token has been revoked',
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        firstName: true,
        surname: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        avatarColor: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_USER_NOT_FOUND,
        message: 'User not found',
      });
    }

    if (!user.isActive) {
      throw new ForbiddenException({
        code: ErrorCodes.AUTH_USER_DISABLED,
        message: 'User account is disabled',
      });
    }

    await this.blacklistToken(refreshToken, payload.exp);

    return this.issueTokens(user);
  }

  async logout(refreshToken: string, meta?: AuditRequestMeta): Promise<void> {
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      // Token invalid, nothing to blacklist
      return;
    }

    await this.blacklistToken(refreshToken, payload.exp);

    this.auditQueue.push({
      userId: payload.sub,
      entity: 'Auth',
      entityId: payload.sub,
      operation: AuditOperation.LOGOUT,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto, meta?: AuditRequestMeta): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_USER_NOT_FOUND,
        message: 'User not found',
      });
    }

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_INVALID_PASSWORD,
        message: 'Current password is invalid',
      });
    }

    const saltRounds = this.configService.get<number>('bcrypt.saltRounds') ?? 12;
    const hashedPassword = await bcrypt.hash(dto.newPassword, saltRounds);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    this.auditQueue.push({
      userId,
      entity: 'User',
      entityId: userId,
      operation: AuditOperation.PASSWORD_CHANGE,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  }

  async verifyPassword(userId: string, dto: VerifyPasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_USER_NOT_FOUND,
        message: 'User not found',
      });
    }

    if (!user.isActive) {
      throw new ForbiddenException({
        code: ErrorCodes.AUTH_USER_DISABLED,
        message: 'User account is disabled',
      });
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_INVALID_PASSWORD,
        message: 'Invalid password',
      });
    }
  }

  async getRecentUserHints(userIds: string[]): Promise<RecentUserHintDto[]> {
    if (userIds.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        surname: true,
        avatarColor: true,
        isActive: true,
      },
    });

    const byId = new Map(users.map((user) => [user.id, user]));
    return userIds
      .map((id) => byId.get(id))
      .filter((user): user is NonNullable<typeof user> => !!user)
      .map((user) => ({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        surname: user.surname,
        avatarColor: user.avatarColor ? user.avatarColor.toLowerCase() : undefined,
        isActive: user.isActive,
      }));
  }

  private async issueTokens(user: AuthUserProfile): Promise<AuthResponseDto> {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const jwtSecret = this.getJwtSecret('jwt.secret');
    const jwtRefreshSecret = this.getJwtSecret('jwt.refreshSecret');
    const jwtExpiresIn = this.configService.get<string>('jwt.expiresIn') ?? DEFAULT_ACCESS_EXPIRES_IN;
    const jwtRefreshExpiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') ?? DEFAULT_REFRESH_EXPIRES_IN;

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: jwtExpiresIn,
    } as Parameters<typeof this.jwtService.sign>[1]);

    const refreshToken = this.jwtService.sign(payload, {
      secret: jwtRefreshSecret,
      expiresIn: jwtRefreshExpiresIn,
    } as Parameters<typeof this.jwtService.sign>[1]);

    return {
      accessToken,
      refreshToken,
      user: {
        ...user,
        avatarColor: user.avatarColor ? user.avatarColor.toLowerCase() : undefined,
      },
    };
  }

  private verifyRefreshToken(refreshToken: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.getJwtSecret('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_INVALID_REFRESH_TOKEN,
        message: 'Invalid refresh token',
      });
    }
  }

  private async blacklistToken(token: string, expiresIn: number): Promise<void> {
    const revocationStore = this.getRevocationStoreOrNull();
    if (!revocationStore) {
      return;
    }

    const ttl = Math.max(expiresIn - Math.floor(Date.now() / 1000), 0);
    if (ttl > 0) {
      try {
        await revocationStore.set(
          `${REFRESH_TOKEN_BLACKLIST_PREFIX}${this.hashToken(token)}`,
          '1',
          'EX',
          ttl,
        );
      } catch (error) {
        if (this.isProduction()) {
          throw new ServiceUnavailableException('Token revocation store unavailable');
        }

        this.logger.warn(`Failed to write refresh token blacklist: ${String(error)}`);
      }
    }
  }

  private async isTokenBlacklisted(token: string): Promise<boolean> {
    const revocationStore = this.getRevocationStoreOrNull();
    if (!revocationStore) {
      return false;
    }

    try {
      const result = await revocationStore.get(
        `${REFRESH_TOKEN_BLACKLIST_PREFIX}${this.hashToken(token)}`,
      );
      return result !== null;
    } catch (error) {
      if (this.isProduction()) {
        throw new ServiceUnavailableException('Token revocation store unavailable');
      }

      this.logger.warn(`Failed to read refresh token blacklist: ${String(error)}`);
      return false;
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getJwtSecret(key: 'jwt.secret' | 'jwt.refreshSecret'): string {
    const secret = this.configService.get<string>(key);
    if (!secret) {
      throw new InternalServerErrorException(`${key} is not configured`);
    }
    return secret;
  }

  private getRevocationStoreOrNull(): Redis | null {
    if (this.redis) {
      return this.redis;
    }

    if (this.isProduction()) {
      throw new ServiceUnavailableException('Token revocation store unavailable');
    }

    this.logger.warn('Redis not available, refresh token revocation disabled in non-production mode');
    return null;
  }

  private isProduction(): boolean {
    return this.configService.get<string>('app.nodeEnv') === 'production';
  }
}
