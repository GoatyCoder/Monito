import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuditQueueService } from '../src/common/events/audit-queue.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('RBAC Real E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let operatorToken: string;

  const apiPrefix = '/api/v1';
  const e2eDbFile = join(process.cwd(), 'prisma', 'e2e-test.db');
  let seq = 0;

  const nextCode = (prefix: string): string => {
    seq += 1;
    return `${prefix}${Date.now()}${seq}`.slice(0, 24);
  };

  const resetDb = async (): Promise<void> => {
    await prisma.palletItem.deleteMany();
    await prisma.pallet.deleteMany();
    await prisma.fieldLot.deleteMany();
    await prisma.variety.deleteMany();
    await prisma.processedProduct.deleteMany();
    await prisma.packaging.deleteMany();
    await prisma.product.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
  };

  const createUser = async (params: {
    username: string;
    role: 'USER' | 'OPERATOR' | 'ADMIN';
  }): Promise<{ id: string; username: string; role: 'USER' | 'OPERATOR' | 'ADMIN' }> => {
    const user = await prisma.user.create({
      data: {
        username: params.username,
        password: 'placeholder',
        firstName: params.username,
        surname: 'Test',
        role: params.role,
      },
    });

    return {
      id: user.id,
      username: user.username,
      role: params.role,
    };
  };

  const createAccessToken = (user: { id: string; username: string; role: string }): string => {
    const jwt = new JwtService({ secret: process.env.JWT_SECRET });
    return jwt.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
      },
      { expiresIn: '15m' },
    );
  };

  beforeAll(async () => {
    if (existsSync(e2eDbFile)) {
      execSync(`del /f /q "${e2eDbFile}"`, {
        shell: 'cmd.exe',
        stdio: 'ignore',
      });
    }

    process.env.NODE_ENV = 'test';
    process.env.API_PREFIX = 'api/v1';
    process.env.DATABASE_URL = 'file:./prisma/e2e-test.db';
    process.env.JWT_SECRET = 'test_jwt_secret_32_chars_long_value';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_32_chars_long';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.BCRYPT_SALT_ROUNDS = '10';

    execSync('pnpm exec prisma db push', {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'ignore',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AuditQueueService)
      .useValue({
        push: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    await resetDb();
    const admin = await createUser({ username: 'admin', role: 'ADMIN' });
    const operator = await createUser({ username: 'operator', role: 'OPERATOR' });

    adminToken = createAccessToken(admin);
    operatorToken = createAccessToken(operator);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('returns 401 for unauthenticated protected endpoint', async () => {
    await request(app.getHttpServer()).get(`${apiPrefix}/products`).expect(401);
  });

  it('exposes public health probes', async () => {
    await request(app.getHttpServer()).get(`${apiPrefix}/health/liveness`).expect(200);
    await request(app.getHttpServer()).get(`${apiPrefix}/health/readiness`).expect(200);
  });

  it('allows ADMIN create and OPERATOR read active resources', async () => {
    const productRes = await request(app.getHttpServer())
      .post(`${apiPrefix}/products`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'P001', name: 'Product 1' })
      .expect(201);

    const productId = productRes.body.data.id as string;

    const varietyRes = await request(app.getHttpServer())
      .post(`${apiPrefix}/varieties`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'V001', name: 'Variety 1', productId })
      .expect(201);

    const varietyId = varietyRes.body.data.id as string;

    await request(app.getHttpServer())
      .post(`${apiPrefix}/processed-products`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'PP001', name: 'Processed 1', weightPerBoxKg: 0.5 })
      .expect(201);

    await request(app.getHttpServer())
      .post(`${apiPrefix}/packagings`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'PK001', name: 'Packaging 1' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`${apiPrefix}/field-lots`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ lotCode: 'LOT001', supplier: 'Supplier 1', varietyId })
      .expect(201);

    const resources = ['products', 'varieties', 'processed-products', 'packagings', 'field-lots', 'pallets'];
    for (const resource of resources) {
      const response = await request(app.getHttpServer())
        .get(`${apiPrefix}/${resource}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.meta).toBeDefined();
    }
  });

  it('forbids OPERATOR from write and trash endpoints', async () => {
    await request(app.getHttpServer())
      .post(`${apiPrefix}/products`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ code: 'P002', name: 'Product 2' })
      .expect(403);

    await request(app.getHttpServer())
      .get(`${apiPrefix}/products/deleted`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(403);
  });

  it('enforces delete -> restore -> purge flow and validation', async () => {
    const created = await request(app.getHttpServer())
      .post(`${apiPrefix}/products`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'P003', name: 'Product 3' })
      .expect(201);

    const id = created.body.data.id as string;

    await request(app.getHttpServer())
      .post(`${apiPrefix}/products/${id}/purge`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'cleanup' })
      .expect(409);

    await request(app.getHttpServer())
      .delete(`${apiPrefix}/products/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .post(`${apiPrefix}/products/${id}/restore`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .delete(`${apiPrefix}/products/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .post(`${apiPrefix}/products/${id}/purge`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'x' })
      .expect(400);

    await request(app.getHttpServer())
      .post(`${apiPrefix}/products/${id}/purge`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Created by mistake and not referenced' })
      .expect(204);
  });

  it('blocks purge when entities are still referenced', async () => {
    const productCode = nextCode('P');
    const varietyCode = nextCode('V');
    const processedCode = nextCode('PP');
    const packagingCode = nextCode('PK');
    const lotCode = `LOT${Date.now().toString().slice(-8)}${seq}`.slice(0, 16);

    const product = await request(app.getHttpServer())
      .post(`${apiPrefix}/products`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: productCode, name: 'Referenced Product' })
      .expect(201);

    const productId = product.body.data.id as string;

    const variety = await request(app.getHttpServer())
      .post(`${apiPrefix}/varieties`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: varietyCode, name: 'Referenced Variety', productId })
      .expect(201);

    const varietyId = variety.body.data.id as string;

    const processed = await request(app.getHttpServer())
      .post(`${apiPrefix}/processed-products`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: processedCode, name: 'Referenced Processed', weightPerBoxKg: 1 })
      .expect(201);

    const processedId = processed.body.data.id as string;

    const packaging = await request(app.getHttpServer())
      .post(`${apiPrefix}/packagings`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: packagingCode, name: 'Referenced Packaging' })
      .expect(201);

    const packagingId = packaging.body.data.id as string;

    const fieldLot = await request(app.getHttpServer())
      .post(`${apiPrefix}/field-lots`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ lotCode, supplier: 'Supplier X', varietyId })
      .expect(201);

    const fieldLotId = fieldLot.body.data.id as string;

    await request(app.getHttpServer())
      .post(`${apiPrefix}/pallets`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fieldLotId,
        items: [
          {
            processedProductId: processedId,
            packagingId,
            quantity: 2,
          },
        ],
      })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`${apiPrefix}/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
    await request(app.getHttpServer())
      .post(`${apiPrefix}/products/${productId}/purge`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'purge referenced product' })
      .expect(409);

    await request(app.getHttpServer())
      .delete(`${apiPrefix}/varieties/${varietyId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
    await request(app.getHttpServer())
      .post(`${apiPrefix}/varieties/${varietyId}/purge`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'purge referenced variety' })
      .expect(409);

    await request(app.getHttpServer())
      .delete(`${apiPrefix}/field-lots/${fieldLotId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
    await request(app.getHttpServer())
      .post(`${apiPrefix}/field-lots/${fieldLotId}/purge`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'purge referenced field lot' })
      .expect(409);

    await request(app.getHttpServer())
      .delete(`${apiPrefix}/packagings/${packagingId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
    await request(app.getHttpServer())
      .post(`${apiPrefix}/packagings/${packagingId}/purge`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'purge referenced packaging' })
      .expect(409);

    await request(app.getHttpServer())
      .delete(`${apiPrefix}/processed-products/${processedId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
    await request(app.getHttpServer())
      .post(`${apiPrefix}/processed-products/${processedId}/purge`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'purge referenced processed product' })
      .expect(409);
  });
});
