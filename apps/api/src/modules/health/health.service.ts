import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis | null,
  ) {}

  getLiveness(): { status: 'ok'; timestamp: string; uptimeSec: number } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSec: Math.floor(process.uptime()),
    };
  }

  async getReadiness(): Promise<{
    status: 'ready' | 'degraded' | 'not_ready';
    timestamp: string;
    checks: {
      database: 'up' | 'down';
      redis: 'up' | 'down' | 'skipped';
    };
  }> {
    let databaseStatus: 'up' | 'down' = 'up';
    let redisStatus: 'up' | 'down' | 'skipped' = 'skipped';

    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
    } catch {
      databaseStatus = 'down';
    }

    if (this.redis) {
      try {
        await this.redis.ping();
        redisStatus = 'up';
      } catch {
        redisStatus = 'down';
      }
    }

    const isProduction = this.configService.get<string>('app.nodeEnv') === 'production';
    const status: 'ready' | 'degraded' | 'not_ready' =
      databaseStatus === 'down'
        ? 'not_ready'
        : redisStatus === 'down' && isProduction
          ? 'not_ready'
          : redisStatus === 'down'
            ? 'degraded'
            : 'ready';

    return {
      status,
      timestamp: new Date().toISOString(),
      checks: {
        database: databaseStatus,
        redis: redisStatus,
      },
    };
  }
}
