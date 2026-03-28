import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { FieldLotsService } from './field-lots.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditQueueService } from '../../common/events/audit-queue.service';

describe('FieldLotsService', () => {
  let service: FieldLotsService;
  let prisma: any;
  let auditQueue: { push: jest.Mock };

  const mockFieldLot = {
    id: 'field-lot-id-1',
    lotCode: 'LOT2026001',
    supplier: 'Paolo Rossi',
    varietyId: 'variety-id-1',
    originCountryCode: 'IT',
    originRegion: '09',
    originProvince: '052',
    originComune: '052001',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    auditQueue = { push: jest.fn() };

    prisma = {
      fieldLot: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      variety: {
        findUnique: jest.fn(),
      },
      pallet: {
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
        FieldLotsService,
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

    service = module.get<FieldLotsService>(FieldLotsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates field lot when variety exists and lotCode is unique', async () => {
    prisma.variety.findUnique.mockResolvedValue({ id: 'variety-id-1' });
    prisma.fieldLot.findUnique.mockResolvedValue(null);
    prisma.fieldLot.create.mockResolvedValue(mockFieldLot);

    const result = await service.create({
      lotCode: 'LOT2026001',
      supplier: 'Paolo Rossi',
      varietyId: 'variety-id-1',
      originCountryCode: 'IT',
      originRegion: '09',
      originProvince: '052',
      originComune: '052001',
    });

    expect(result.id).toBe(mockFieldLot.id);
    expect(auditQueue.push).toHaveBeenCalled();
  });

  it('throws NotFoundException when variety does not exist', async () => {
    prisma.variety.findUnique.mockResolvedValue(null);

    await expect(
      service.create({
        lotCode: 'LOT2026001',
        supplier: 'P',
        varietyId: 'missing',
        originCountryCode: 'IT',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ConflictException when lotCode already exists', async () => {
    prisma.variety.findUnique.mockResolvedValue({ id: 'variety-id-1' });
    prisma.fieldLot.findUnique.mockResolvedValue(mockFieldLot);

    await expect(
      service.create({
        lotCode: 'LOT2026001',
        supplier: 'Paolo Rossi',
        varietyId: 'variety-id-1',
        originCountryCode: 'IT',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('throws BadRequest when origin country code is invalid', async () => {
    prisma.variety.findUnique.mockResolvedValue({ id: 'variety-id-1' });

    await expect(
      service.create({
        lotCode: 'LOT2026002',
        supplier: 'Paolo Rossi',
        varietyId: 'variety-id-1',
        originCountryCode: 'ZZ',
      }),
    ).rejects.toThrow('originCountryCode is not a valid ISO country code');
  });

  it('throws BadRequest when italian comune is not coherent with province', async () => {
    prisma.variety.findUnique.mockResolvedValue({ id: 'variety-id-1' });

    await expect(
      service.create({
        lotCode: 'LOT2026003',
        supplier: 'Paolo Rossi',
        varietyId: 'variety-id-1',
        originCountryCode: 'IT',
        originProvince: '001',
        originComune: '052001',
      }),
    ).rejects.toThrow('originComune is not coherent with originProvince');
  });

  it('returns paginated active field lots', async () => {
    prisma.fieldLot.findMany.mockResolvedValue([mockFieldLot]);
    prisma.fieldLot.count.mockResolvedValue(1);

    const result = await service.findAll({ page: 1, limit: 20 });

    expect(result.meta.total).toBe(1);
  });

  it('returns paginated deleted field lots', async () => {
    prisma.fieldLot.findMany.mockResolvedValue([{ ...mockFieldLot, deletedAt: new Date() }]);
    prisma.fieldLot.count.mockResolvedValue(1);

    const result = await service.findDeleted({ page: 1, limit: 20 });

    expect(result.meta.total).toBe(1);
  });

  it('finds field lot with details', async () => {
    prisma.fieldLot.findUnique.mockResolvedValue({
      ...mockFieldLot,
      variety: {
        id: 'variety-id-1',
        code: 'CRIMSON',
        name: 'Crimson',
        description: null,
        productId: 'product-id-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    });

    const result = await service.findByIdWithDetails('field-lot-id-1');
    expect((result.variety as { id: string }).id).toBe('variety-id-1');
  });

  it('throws NotFoundException for missing field lot by id', async () => {
    prisma.fieldLot.findUnique.mockResolvedValue(null);

    await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
  });

  it('soft deletes field lot', async () => {
    prisma.fieldLot.findUnique.mockResolvedValue(mockFieldLot);
    prisma.fieldLot.update.mockResolvedValue({ ...mockFieldLot, deletedAt: new Date() });

    await service.delete('field-lot-id-1');

    expect(prisma.fieldLot.update).toHaveBeenCalledWith({
      where: { id: 'field-lot-id-1' },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it('throws ConflictException when deleting already deleted field lot', async () => {
    prisma.fieldLot.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      ...mockFieldLot,
      deletedAt: new Date(),
    });

    await expect(service.delete('field-lot-id-1')).rejects.toThrow(ConflictException);
  });

  it('throws ConflictException when restoring active field lot', async () => {
    prisma.fieldLot.findUnique.mockResolvedValue(mockFieldLot);

    await expect(service.restore('field-lot-id-1')).rejects.toThrow(ConflictException);
  });

  it('throws ConflictException when purging active field lot', async () => {
    prisma.fieldLot.findUnique.mockResolvedValue(mockFieldLot);

    await expect(service.purge('field-lot-id-1', 'cleanup')).rejects.toThrow(ConflictException);
  });

  it('throws ConflictException when purging referenced field lot', async () => {
    prisma.fieldLot.findUnique.mockResolvedValue({ ...mockFieldLot, deletedAt: new Date() });
    prisma.pallet.count.mockResolvedValue(1);

    await expect(service.purge('field-lot-id-1', 'cleanup')).rejects.toThrow(ConflictException);
  });

  it('purges deleted and unreferenced field lot', async () => {
    prisma.fieldLot.findUnique.mockResolvedValue({ ...mockFieldLot, deletedAt: new Date() });
    prisma.pallet.count.mockResolvedValue(0);
    prisma.fieldLot.delete.mockResolvedValue({ ...mockFieldLot, deletedAt: new Date() });

    await service.purge('field-lot-id-1', 'cleanup');

    expect(prisma.fieldLot.delete).toHaveBeenCalledWith({ where: { id: 'field-lot-id-1' } });
    expect(auditQueue.push).toHaveBeenCalled();
  });
});
