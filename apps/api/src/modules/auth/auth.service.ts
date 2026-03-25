import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';

const REFRESH_TOKEN_BLACKLIST_PREFIX = 'refresh:blacklist:';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private redisClient: import('ioredis').Redis | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
    const redis = this.getRedisClient();
    const ttl = Math.max(expiresIn - Math.floor(Date.now() / 1000), 0);
    if (ttl > 0 && redis) {
      await redis.set(`${REFRESH_TOKEN_BLACKLIST_PREFIX}${this.hashToken(token)}`, '1', 'EX', ttl);
    }
  }

  private async isTokenBlacklisted(token: string): Promise<boolean> {
    const redis = this.getRedisClient();
    if (!redis) return false;
    const result = await redis.get(`${REFRESH_TOKEN_BLACKLIST_PREFIX}${this.hashToken(token)}`);
    return result !== null;
  }

  private getRedisClient(): import('ioredis').Redis | null {
    if (this.redisClient) return this.redisClient;
    
    try {
      const Redis = require('ioredis');
      this.redisClient = new Redis({
        host: this.configService.get<string>('redis.host') ?? 'localhost',
        port: this.configService.get<number>('redis.port') ?? 6379,
        password: this.configService.get<string>('redis.password') || undefined,
        lazyConnect: true,
      });
      return this.redisClient;
    } catch {
      this.logger.warn('Redis not available, token blacklist disabled');
      return null;
    }
  }

  private hashToken(token: string): string {
    return Buffer.from(token).toString('base64').slice(0, 32);
  }
}
