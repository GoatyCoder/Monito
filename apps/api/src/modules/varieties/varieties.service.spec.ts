import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { VarietiesService } from './varieties.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditQueueService } from '../../common/events/audit-queue.service';

describe('VarietiesService', () => {
  let service: VarietiesService;
  let prisma: any;
  let auditQueue: { push: jest.Mock };

  const mockVariety = {
    id: 'variety-id-1',
    code: 'CRIMSON',
    name: 'Crimson Seedless',
    description: 'Sample',
    productId: 'product-id-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    auditQueue = { push: jest.fn() };

    prisma = {
      variety: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      product: {
        findUnique: jest.fn(),
      },
      fieldLot: {
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
        VarietiesService,
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

    service = module.get<VarietiesService>(VarietiesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a variety when code is unique and product exists', async () => {
    prisma.variety.findUnique.mockResolvedValue(null);
    prisma.product.findUnique.mockResolvedValue({ id: 'product-id-1' });
    prisma.variety.create.mockResolvedValue(mockVariety);

    const result = await service.create({
      code: 'CRIMSON',
      name: 'Crimson Seedless',
      productId: 'product-id-1',
    });

    expect(result.id).toBe(mockVariety.id);
    expect(prisma.variety.create).toHaveBeenCalled();
    expect(auditQueue.push).toHaveBeenCalled();
  });

  it('throws ConflictException when code already exists', async () => {
    prisma.variety.findUnique.mockResolvedValue(mockVariety);

    await expect(
      service.create({ code: 'CRIMSON', name: 'Crimson', productId: 'product-id-1' }),
    ).rejects.toThrow(ConflictException);
  });

  it('throws NotFoundException when product does not exist', async () => {
    prisma.variety.findUnique.mockResolvedValue(null);
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(
      service.create({ code: 'CRIMSON', name: 'Crimson', productId: 'missing' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns paginated active varieties', async () => {
    prisma.variety.findMany.mockResolvedValue([mockVariety]);
    prisma.variety.count.mockResolvedValue(1);

    const result = await service.findAll({ page: 1, limit: 20 });

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('returns paginated deleted varieties', async () => {
    prisma.variety.findMany.mockResolvedValue([{ ...mockVariety, deletedAt: new Date() }]);
    prisma.variety.count.mockResolvedValue(1);

    const result = await service.findDeleted({ page: 1, limit: 20 });

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('throws NotFoundException when findById misses record', async () => {
    prisma.variety.findUnique.mockResolvedValue(null);

    await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
  });

  it('soft deletes a variety', async () => {
    prisma.variety.findUnique.mockResolvedValue(mockVariety);
    prisma.variety.update.mockResolvedValue({ ...mockVariety, deletedAt: new Date() });

    await service.delete('variety-id-1');

    expect(prisma.variety.update).toHaveBeenCalledWith({
      where: { id: 'variety-id-1' },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it('throws ConflictException when deleting already deleted variety', async () => {
    prisma.variety.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      ...mockVariety,
      deletedAt: new Date(),
    });

    await expect(service.delete('variety-id-1')).rejects.toThrow(ConflictException);
  });

  it('throws ConflictException when restoring active variety', async () => {
    prisma.variety.findUnique.mockResolvedValue({ ...mockVariety, deletedAt: null });

    await expect(service.restore('variety-id-1')).rejects.toThrow(ConflictException);
  });

  it('throws ConflictException when purging active variety', async () => {
    prisma.variety.findUnique.mockResolvedValue({ ...mockVariety, deletedAt: null });

    await expect(service.purge('variety-id-1', 'cleanup')).rejects.toThrow(ConflictException);
  });

  it('throws ConflictException when purging referenced variety', async () => {
    prisma.variety.findUnique.mockResolvedValue({ ...mockVariety, deletedAt: new Date() });
    prisma.fieldLot.count.mockResolvedValue(1);

    await expect(service.purge('variety-id-1', 'cleanup')).rejects.toThrow(ConflictException);
  });

  it('purges deleted and unreferenced variety', async () => {
    prisma.variety.findUnique.mockResolvedValue({ ...mockVariety, deletedAt: new Date() });
    prisma.fieldLot.count.mockResolvedValue(0);
    prisma.variety.delete.mockResolvedValue({ ...mockVariety, deletedAt: new Date() });

    await service.purge('variety-id-1', 'cleanup');

    expect(prisma.variety.delete).toHaveBeenCalledWith({ where: { id: 'variety-id-1' } });
    expect(auditQueue.push).toHaveBeenCalled();
  });
});
