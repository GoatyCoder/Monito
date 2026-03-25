import { Injectable, UnauthorizedException, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';

const REFRESH_TOKEN_BLACKLIST_PREFIX = 'refresh:blacklist:';

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
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, user.username, user.role);
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const isBlacklisted = await this.isTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      await this.blacklistToken(refreshToken, payload.exp);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user.id, user.username, user.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
      await this.blacklistToken(refreshToken, payload.exp);
    } catch {
      // Token invalid, nothing to blacklist
    }
  }

  private async generateTokens(
    userId: string,
    username: string,
    role: 'USER' | 'ADMIN',
  ): Promise<AuthResponseDto> {
    const payload = {
      sub: userId,
      username,
      role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private async blacklistToken(token: string, expiresIn: number): Promise<void> {
    if (!this.redis) {
      this.logger.warn('Redis not available, token blacklist disabled');
      return;
    }
    const ttl = Math.max(expiresIn - Math.floor(Date.now() / 1000), 0);
    if (ttl > 0) {
      await this.redis.set(`${REFRESH_TOKEN_BLACKLIST_PREFIX}${this.hashToken(token)}`, '1', 'EX', ttl);
    }
  }

  private async isTokenBlacklisted(token: string): Promise<boolean> {
    if (!this.redis) return false;
    const result = await this.redis.get(`${REFRESH_TOKEN_BLACKLIST_PREFIX}${this.hashToken(token)}`);
    return result !== null;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
