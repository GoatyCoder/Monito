import { Module, Global, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService): Redis => {
        const logger = new Logger('RedisModule');
        
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

  async onModuleDestroy() {
    await this.redis.quit();
  }
}