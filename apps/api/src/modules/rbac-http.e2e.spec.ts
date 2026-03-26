import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { TransformInterceptor } from '../common/interceptors/transform.interceptor';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';
import { VarietiesController } from './varieties/varieties.controller';
import { ProductVarietiesController } from './varieties/product-varieties.controller';
import { VarietiesService } from './varieties/varieties.service';
import { PackagingsController } from './packagings/packagings.controller';
import { PackagingsService } from './packagings/packagings.service';
import { ProcessedProductsController } from './processed-products/processed-products.controller';
import { ProcessedProductsService } from './processed-products/processed-products.service';
import { FieldLotsController } from './field-lots/field-lots.controller';
import { FieldLotsService } from './field-lots/field-lots.service';
import { PalletsController } from './pallets/pallets.controller';
import { PalletsService } from './pallets/pallets.service';
import { RolesGuard } from './auth/guards';

class TestJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers.authorization as string | undefined;

    if (auth === 'Bearer admin') {
      req.user = { sub: 'admin-id', role: 'ADMIN' };
      return true;
    }

    if (auth === 'Bearer operator') {
      req.user = { sub: 'operator-id', role: 'OPERATOR' };
      return true;
    }

    throw new UnauthorizedException('Missing or invalid token');
  }
}

const paginated = { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };

describe('RBAC HTTP', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const productsServiceMock = {
      findAll: jest.fn().mockResolvedValue(paginated),
      findDeleted: jest.fn().mockResolvedValue(paginated),
      create: jest.fn().mockResolvedValue({ id: 'p1' }),
      delete: jest.fn().mockResolvedValue(undefined),
      purge: jest.fn().mockResolvedValue(undefined),
    };

    const varietiesServiceMock = {
      findAll: jest.fn().mockResolvedValue(paginated),
      findDeleted: jest.fn().mockResolvedValue(paginated),
      findByProductId: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'v1' }),
      delete: jest.fn().mockResolvedValue(undefined),
      purge: jest.fn().mockResolvedValue(undefined),
    };

    const packagingsServiceMock = {
      findAll: jest.fn().mockResolvedValue(paginated),
      findDeleted: jest.fn().mockResolvedValue(paginated),
      create: jest.fn().mockResolvedValue({ id: 'pk1' }),
      delete: jest.fn().mockResolvedValue(undefined),
      purge: jest.fn().mockResolvedValue(undefined),
    };

    const processedProductsServiceMock = {
      findAll: jest.fn().mockResolvedValue(paginated),
      findDeleted: jest.fn().mockResolvedValue(paginated),
      create: jest.fn().mockResolvedValue({ id: 'pp1' }),
      delete: jest.fn().mockResolvedValue(undefined),
      purge: jest.fn().mockResolvedValue(undefined),
    };

    const fieldLotsServiceMock = {
      findAll: jest.fn().mockResolvedValue(paginated),
      findDeleted: jest.fn().mockResolvedValue(paginated),
      create: jest.fn().mockResolvedValue({ id: 'fl1' }),
      delete: jest.fn().mockResolvedValue(undefined),
      purge: jest.fn().mockResolvedValue(undefined),
    };

    const palletsServiceMock = {
      findAll: jest.fn().mockResolvedValue(paginated),
      findDeleted: jest.fn().mockResolvedValue(paginated),
      create: jest.fn().mockResolvedValue({ id: 'pa1' }),
      delete: jest.fn().mockResolvedValue(undefined),
      purge: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [
        ProductsController,
        VarietiesController,
        ProductVarietiesController,
        PackagingsController,
        ProcessedProductsController,
        FieldLotsController,
        PalletsController,
      ],
      providers: [
        { provide: APP_GUARD, useClass: TestJwtGuard },
        RolesGuard,
        { provide: ProductsService, useValue: productsServiceMock },
        { provide: VarietiesService, useValue: varietiesServiceMock },
        { provide: PackagingsService, useValue: packagingsServiceMock },
        { provide: ProcessedProductsService, useValue: processedProductsServiceMock },
        { provide: FieldLotsService, useValue: fieldLotsServiceMock },
        { provide: PalletsService, useValue: palletsServiceMock },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 401 for unauthenticated access', async () => {
    await request(app.getHttpServer()).get('/products').expect(401);
  });

  it('allows OPERATOR to read active resources', async () => {
    await request(app.getHttpServer())
      .get('/products')
      .set('Authorization', 'Bearer operator')
      .expect(200);

    await request(app.getHttpServer())
      .get('/varieties')
      .set('Authorization', 'Bearer operator')
      .expect(200);

    await request(app.getHttpServer())
      .get('/products/product-id/varieties')
      .set('Authorization', 'Bearer operator')
      .expect(200);

    await request(app.getHttpServer())
      .get('/packagings')
      .set('Authorization', 'Bearer operator')
      .expect(200);

    await request(app.getHttpServer())
      .get('/processed-products')
      .set('Authorization', 'Bearer operator')
      .expect(200);

    await request(app.getHttpServer())
      .get('/field-lots')
      .set('Authorization', 'Bearer operator')
      .expect(200);

    await request(app.getHttpServer())
      .get('/pallets')
      .set('Authorization', 'Bearer operator')
      .expect(200);
  });

  it('forbids OPERATOR from trash/read-write endpoints', async () => {
    await request(app.getHttpServer())
      .get('/products/deleted')
      .set('Authorization', 'Bearer operator')
      .expect(403);

    await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', 'Bearer operator')
      .send({ code: 'P001', name: 'Product 1' })
      .expect(403);

    await request(app.getHttpServer())
      .delete('/products/p1')
      .set('Authorization', 'Bearer operator')
      .expect(403);

    await request(app.getHttpServer())
      .post('/products/p1/purge')
      .set('Authorization', 'Bearer operator')
      .send({ reason: 'cleanup' })
      .expect(403);

    await request(app.getHttpServer())
      .post('/pallets')
      .set('Authorization', 'Bearer operator')
      .send({ fieldLotId: 'fl1', items: [] })
      .expect(403);
  });

  it('allows ADMIN to use trash and write endpoints', async () => {
    await request(app.getHttpServer()).get('/products/deleted').set('Authorization', 'Bearer admin').expect(200);

    await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', 'Bearer admin')
      .send({ code: 'P001', name: 'Product 1' })
      .expect(201);

    await request(app.getHttpServer())
      .delete('/products/p1')
      .set('Authorization', 'Bearer admin')
      .expect(204);

    await request(app.getHttpServer())
      .post('/products/p1/purge')
      .set('Authorization', 'Bearer admin')
      .send({ reason: 'cleanup invalid seed data' })
      .expect(204);
  });

  it('returns 400 when purge reason is invalid', async () => {
    await request(app.getHttpServer())
      .post('/products/p1/purge')
      .set('Authorization', 'Bearer admin')
      .send({ reason: 'x' })
      .expect(400);
  });
});
