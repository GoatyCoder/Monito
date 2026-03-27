import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditQueueService } from '../../common/events/audit-queue.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductSubtypesService } from './product-subtypes.service';

describe('ProductSubtypesService', () => {
  let service: ProductSubtypesService;
  let prisma: any;
  let auditQueue: { push: jest.Mock };

  const mockSubtype = {
    id: 'subtype-id-1',
    code: 'WHITE_SS',
    name: 'Bianca senza semi',
    description: 'Uva bianca seedless',
    productId: 'product-id-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    auditQueue = { push: jest.fn() };

    prisma = {
      productSubtype: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      product: {
        findUnique: jest.fn(),
      },
      variety: {
        count: jest.fn(),
      },
      $transaction: jest.fn((arg: ((tx: any) => Promise<unknown>) | unknown[]) => {
        if (Array.isArray(arg)) {
          return Promise.all(arg);
        }
        return arg(prisma);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductSubtypesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: AuditQueueService,
          useValue: auditQueue,
        },
      ],
    }).compile();

    service = module.get<ProductSubtypesService>(ProductSubtypesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates subtype when product exists and code is unique in product scope', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'product-id-1' });
    prisma.productSubtype.findFirst.mockResolvedValue(null);
    prisma.productSubtype.create.mockResolvedValue(mockSubtype);

    const result = await service.create({
      code: 'WHITE_SS',
      name: 'Bianca senza semi',
      productId: 'product-id-1',
    });

    expect(result.id).toBe(mockSubtype.id);
    expect(auditQueue.push).toHaveBeenCalled();
  });

  it('throws ConflictException when same code exists in same product', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'product-id-1' });
    prisma.productSubtype.findFirst.mockResolvedValue(mockSubtype);

    await expect(
      service.create({ code: 'WHITE_SS', name: 'Bianca senza semi', productId: 'product-id-1' }),
    ).rejects.toThrow(ConflictException);
  });

  it('allows same code for different product', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'product-id-2' });
    prisma.productSubtype.findFirst.mockResolvedValue(null);
    prisma.productSubtype.create.mockResolvedValue({
      ...mockSubtype,
      id: 'subtype-id-2',
      productId: 'product-id-2',
    });

    const result = await service.create({
      code: 'WHITE_SS',
      name: 'Bianca senza semi',
      productId: 'product-id-2',
    });

    expect(result.productId).toBe('product-id-2');
  });

  it('throws NotFoundException when product does not exist', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(
      service.create({ code: 'WHITE_SS', name: 'Bianca senza semi', productId: 'missing' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ConflictException when purging subtype referenced by active varieties', async () => {
    prisma.productSubtype.findUnique.mockResolvedValue({ ...mockSubtype, deletedAt: new Date() });
    prisma.variety.count.mockResolvedValue(1);

    await expect(service.purge('subtype-id-1', 'cleanup')).rejects.toThrow(ConflictException);
  });
});
