import { Module, Global, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: 'EX', ttl: number): Promise<'OK'>;
  ping(): Promise<'PONG'>;
  quit(): Promise<'OK'>;
  on(event: string, listener: (...args: unknown[]) => void): void;
}

function createNoopRedisClient(): RedisLike {
  return {
    async get(): Promise<string | null> {
      return null;
    },
    async set(): Promise<'OK'> {
      return 'OK';
    },
    async ping(): Promise<'PONG'> {
      return 'PONG';
    },
    async quit(): Promise<'OK'> {
      return 'OK';
    },
    on(): void {
      // noop
    },
  };
}

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService): Redis => {
        const logger = new Logger('RedisModule');

        if (configService.get<string>('app.nodeEnv') === 'test') {
          logger.log('Using in-memory Redis mock client in test environment');
          return createNoopRedisClient() as unknown as Redis;
        }
        
        const redis = new Redis({
          host: configService.get<string>('redis.host') ?? 'localhost',
          port: configService.get<number>('redis.port') ?? 6379,
          password: configService.get<string>('redis.password') || undefined,
          lazyConnect: true,
          reconnectOnError: (err) => {
            logger.error(`Redis reconnect on error: ${err.message}`);
            return true;
          },
          maxRetriesPerRequest: 3,
        });

        redis.on('error', (err) => {
          logger.error(`Redis connection error: ${err.message}`);
        });

        redis.on('connect', () => {
          logger.log('Redis connected');
        });

        return redis;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
