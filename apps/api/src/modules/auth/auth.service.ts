import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  ServiceUnavailableException,
  Logger,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { Role } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';

const REFRESH_TOKEN_BLACKLIST_PREFIX = 'refresh:blacklist:';
const DEFAULT_ACCESS_EXPIRES_IN = '15m';
const DEFAULT_REFRESH_EXPIRES_IN = '7d';

interface AuthUserProfile {
  id: string;
  username: string;
  firstName: string;
  surname: string;
  role: Role;
  avatarColor?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis | null,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      select: {
        id: true,
        username: true,
        password: true,
        firstName: true,
        surname: true,
        role: true,
        avatarColor: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      surname: user.surname,
      role: user.role,
      avatarColor: user.avatarColor,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const payload = this.verifyRefreshToken(refreshToken);

    const isBlacklisted = await this.isTokenBlacklisted(refreshToken);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        firstName: true,
        surname: true,
        role: true,
        avatarColor: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.blacklistToken(refreshToken, payload.exp);

    return this.issueTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
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
      throw new UnauthorizedException('Invalid refresh token');
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
