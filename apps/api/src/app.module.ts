import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { PassportModule } from '@nestjs/passport';
import { appConfig, jwtConfig, redisConfig, bcryptConfig } from './config';
import { RedisModule } from './config/redis.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { VarietiesModule } from './modules/varieties/varieties.module';
import { FieldLotsModule } from './modules/field-lots/field-lots.module';
import { ProcessedProductsModule } from './modules/processed-products/processed-products.module';
import { PackagingsModule } from './modules/packagings/packagings.module';
import { PalletsModule } from './modules/pallets/pallets.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { JwtStrategy } from './modules/auth/strategies/jwt.strategy';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, redisConfig, bcryptConfig],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
      inject: [ConfigService],
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    RedisModule,
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    VarietiesModule,
    FieldLotsModule,
    ProcessedProductsModule,
    PackagingsModule,
    PalletsModule,
  ],
  providers: [
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
