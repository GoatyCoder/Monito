import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProcessedProductsService } from './processed-products.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditQueueService } from '../../common/events/audit-queue.service';

describe('ProcessedProductsService', () => {
  let service: ProcessedProductsService;
  let prisma: any;
  let auditQueue: { push: jest.Mock };

  const mockProcessedProduct = {
    id: 'processed-id-1',
    code: 'CEST10X500',
    name: 'Cestino 10x500g',
    description: 'Sample',
    ean: '1234567890123',
    weightPerBoxKg: 0.5,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    auditQueue = { push: jest.fn() };

    prisma = {
      processedProduct: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      palletItem: {
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
        ProcessedProductsService,
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

    service = module.get<ProcessedProductsService>(ProcessedProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates processed product when code and ean are unique', async () => {
    prisma.processedProduct.findFirst.mockResolvedValueOnce(null);
    prisma.processedProduct.findUnique.mockResolvedValueOnce(null);
    prisma.processedProduct.create.mockResolvedValue(mockProcessedProduct);

    const result = await service.create({
      code: 'CEST10X500',
      name: 'Cestino 10x500g',
      ean: '1234567890123',
      weightPerBoxKg: 0.5,
    });

    expect(result.id).toBe(mockProcessedProduct.id);
    expect(auditQueue.push).toHaveBeenCalled();
  });

  it('throws ConflictException when code already exists', async () => {
    prisma.processedProduct.findFirst.mockResolvedValue(mockProcessedProduct);

    await expect(
      service.create({ code: 'CEST10X500', name: 'X', weightPerBoxKg: 0.5 }),
    ).rejects.toThrow(ConflictException);
  });

  it('throws ConflictException when ean already exists', async () => {
    prisma.processedProduct.findFirst.mockResolvedValueOnce(null);
    prisma.processedProduct.findUnique.mockResolvedValueOnce(mockProcessedProduct);

    await expect(
      service.create({
        code: 'CEST10X500',
        name: 'X',
        ean: '1234567890123',
        weightPerBoxKg: 0.5,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('throws ConflictException on update when ean already exists', async () => {
    prisma.processedProduct.findUnique
      .mockResolvedValueOnce(mockProcessedProduct)
      .mockResolvedValueOnce(mockProcessedProduct);

    await expect(service.update('processed-id-1', { ean: '9999999999999' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('returns paginated active processed products', async () => {
    prisma.processedProduct.findMany.mockResolvedValue([mockProcessedProduct]);
    prisma.processedProduct.count.mockResolvedValue(1);

    const result = await service.findAll({ page: 1, limit: 20 });

    expect(result.meta.total).toBe(1);
  });

  it('returns all active processed products without pagination', async () => {
    prisma.processedProduct.findMany.mockResolvedValue([mockProcessedProduct]);

    const result = await service.findAllActive();

    expect(prisma.processedProduct.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
    expect(result).toHaveLength(1);
  });

  it('returns paginated deleted processed products', async () => {
    prisma.processedProduct.findMany.mockResolvedValue([
      { ...mockProcessedProduct, deletedAt: new Date() },
    ]);
    prisma.processedProduct.count.mockResolvedValue(1);

    const result = await service.findDeleted({ page: 1, limit: 20 });

    expect(result.meta.total).toBe(1);
  });

  it('throws NotFoundException for missing by id', async () => {
    prisma.processedProduct.findUnique.mockResolvedValue(null);

    await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
  });

  it('soft deletes processed product', async () => {
    prisma.processedProduct.findUnique.mockResolvedValue(mockProcessedProduct);
    prisma.processedProduct.update.mockResolvedValue({ ...mockProcessedProduct, deletedAt: new Date() });

    await service.delete('processed-id-1');

    expect(prisma.processedProduct.update).toHaveBeenCalledWith({
      where: { id: 'processed-id-1' },
      data: {
        deletedAt: expect.any(Date),
        code: expect.stringMatching(/^CEST10X500_del_\d+$/),
      },
    });
  });

  it('throws ConflictException when restoring deleted processed product with reused code', async () => {
    prisma.processedProduct.findUnique.mockResolvedValue({
      ...mockProcessedProduct,
      code: 'CEST10X500_del_1700000000000',
      deletedAt: new Date(),
    });
    prisma.processedProduct.findFirst.mockResolvedValue({
      ...mockProcessedProduct,
      id: 'processed-id-2',
      code: 'CEST10X500',
    });

    await expect(service.restore('processed-id-1')).rejects.toThrow(ConflictException);
  });

  it('throws ConflictException when deleting already deleted processed product', async () => {
    prisma.processedProduct.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      ...mockProcessedProduct,
      deletedAt: new Date(),
    });

    await expect(service.delete('processed-id-1')).rejects.toThrow(ConflictException);
  });

  it('throws ConflictException when restoring active processed product', async () => {
    prisma.processedProduct.findUnique.mockResolvedValue(mockProcessedProduct);

    await expect(service.restore('processed-id-1')).rejects.toThrow(ConflictException);
  });

  it('throws ConflictException when purging active processed product', async () => {
    prisma.processedProduct.findUnique.mockResolvedValue(mockProcessedProduct);

    await expect(service.purge('processed-id-1', 'cleanup')).rejects.toThrow(ConflictException);
  });

  it('throws ConflictException when purging referenced processed product', async () => {
    prisma.processedProduct.findUnique.mockResolvedValue({
      ...mockProcessedProduct,
      deletedAt: new Date(),
    });
    prisma.palletItem.count.mockResolvedValue(2);

    await expect(service.purge('processed-id-1', 'cleanup')).rejects.toThrow(ConflictException);
  });

  it('purges deleted and unreferenced processed product', async () => {
    prisma.processedProduct.findUnique.mockResolvedValue({
      ...mockProcessedProduct,
      deletedAt: new Date(),
    });
    prisma.palletItem.count.mockResolvedValue(0);
    prisma.processedProduct.delete.mockResolvedValue({
      ...mockProcessedProduct,
      deletedAt: new Date(),
    });

    await service.purge('processed-id-1', 'cleanup');

    expect(prisma.processedProduct.delete).toHaveBeenCalledWith({ where: { id: 'processed-id-1' } });
    expect(auditQueue.push).toHaveBeenCalled();
  });
});
