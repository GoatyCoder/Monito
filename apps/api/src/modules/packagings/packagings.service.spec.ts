import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PackagingsService } from './packagings.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditQueueService } from '../../common/events/audit-queue.service';

describe('PackagingsService', () => {
  let service: PackagingsService;
  let prisma: any;
  let auditQueue: { push: jest.Mock };

  const mockPackaging = {
    id: 'packaging-id-1',
    code: 'IFCO6410',
    name: 'IFCO 6410',
    description: 'Plastic crate',
    tareKg: 0.35,
    outerLengthMm: 600,
    outerWidthMm: 400,
    outerHeightMm: 120,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    auditQueue = { push: jest.fn() };

    prisma = {
      packaging: {
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
        PackagingsService,
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

    service = module.get<PackagingsService>(PackagingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates packaging when code is unique', async () => {
    prisma.packaging.findFirst.mockResolvedValue(null);
    prisma.packaging.create.mockResolvedValue(mockPackaging);

    const result = await service.create({
      code: 'IFCO6410',
      name: 'IFCO 6410',
      tareKg: 0.35,
      outerLengthMm: 600,
      outerWidthMm: 400,
      outerHeightMm: 120,
    });

    expect(result.id).toBe(mockPackaging.id);
    expect(auditQueue.push).toHaveBeenCalled();
  });

  it('throws ConflictException when code already exists', async () => {
    prisma.packaging.findFirst.mockResolvedValue(mockPackaging);

    await expect(
      service.create({
        code: 'IFCO6410',
        name: 'IFCO',
        tareKg: 0.35,
        outerLengthMm: 600,
        outerWidthMm: 400,
        outerHeightMm: 120,
      }),
    ).rejects.toThrow(
      ConflictException,
    );
  });

  it('returns paginated active packagings', async () => {
    prisma.packaging.findMany.mockResolvedValue([mockPackaging]);
    prisma.packaging.count.mockResolvedValue(1);

    const result = await service.findAll({ page: 1, limit: 20 });

    expect(result.meta.total).toBe(1);
  });

  it('returns all active packagings without pagination', async () => {
    prisma.packaging.findMany.mockResolvedValue([mockPackaging]);

    const result = await service.findAllActive();

    expect(prisma.packaging.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
    expect(result).toHaveLength(1);
  });

  it('returns paginated deleted packagings', async () => {
    prisma.packaging.findMany.mockResolvedValue([{ ...mockPackaging, deletedAt: new Date() }]);
    prisma.packaging.count.mockResolvedValue(1);

    const result = await service.findDeleted({ page: 1, limit: 20 });

    expect(result.meta.total).toBe(1);
  });

  it('throws NotFoundException for missing packaging by id', async () => {
    prisma.packaging.findUnique.mockResolvedValue(null);

    await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
  });

  it('soft deletes packaging', async () => {
    prisma.packaging.findUnique.mockResolvedValue(mockPackaging);
    prisma.packaging.update.mockResolvedValue({ ...mockPackaging, deletedAt: new Date() });

    await service.delete('packaging-id-1');

    expect(prisma.packaging.update).toHaveBeenCalledWith({
      where: { id: 'packaging-id-1' },
      data: {
        deletedAt: expect.any(Date),
        code: expect.stringMatching(/^IFCO6410_del_\d+$/),
      },
    });
  });

  it('throws ConflictException when restoring deleted packaging with reused code', async () => {
    prisma.packaging.findUnique.mockResolvedValue({
      ...mockPackaging,
      code: 'IFCO6410_del_1700000000000',
      deletedAt: new Date(),
    });
    prisma.packaging.findFirst.mockResolvedValue({ ...mockPackaging, id: 'packaging-id-2', code: 'IFCO6410' });

    await expect(service.restore('packaging-id-1')).rejects.toThrow(ConflictException);
  });

  it('throws ConflictException when deleting already deleted packaging', async () => {
    prisma.packaging.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      ...mockPackaging,
      deletedAt: new Date(),
    });

    await expect(service.delete('packaging-id-1')).rejects.toThrow(ConflictException);
  });

  it('throws ConflictException when restoring active packaging', async () => {
    prisma.packaging.findUnique.mockResolvedValue(mockPackaging);

    await expect(service.restore('packaging-id-1')).rejects.toThrow(ConflictException);
  });

  it('throws ConflictException when purging active packaging', async () => {
    prisma.packaging.findUnique.mockResolvedValue(mockPackaging);

    await expect(service.purge('packaging-id-1', 'cleanup')).rejects.toThrow(ConflictException);
  });

  it('throws ConflictException when purging referenced packaging', async () => {
    prisma.packaging.findUnique.mockResolvedValue({ ...mockPackaging, deletedAt: new Date() });
    prisma.palletItem.count.mockResolvedValue(2);

    await expect(service.purge('packaging-id-1', 'cleanup')).rejects.toThrow(ConflictException);
  });

  it('purges packaging when deleted and not referenced', async () => {
    prisma.packaging.findUnique.mockResolvedValue({ ...mockPackaging, deletedAt: new Date() });
    prisma.palletItem.count.mockResolvedValue(0);
    prisma.packaging.delete.mockResolvedValue({ ...mockPackaging, deletedAt: new Date() });

    await service.purge('packaging-id-1', 'cleanup');

    expect(prisma.packaging.delete).toHaveBeenCalledWith({ where: { id: 'packaging-id-1' } });
    expect(auditQueue.push).toHaveBeenCalled();
  });
});
