import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditQueueService } from '../../common/events/audit-queue.service';

jest.mock('../../common/events/audit-queue.service');

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: any;
  let auditQueue: { push: jest.Mock };

  const mockProduct = {
    id: 'product-id-1',
    code: 'UVA',
    name: 'Uva da tavola',
    description: 'Uva italiana',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    auditQueue = { push: jest.fn() };

    prisma = {
      product: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
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
        ProductsService,
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

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = { code: 'UVA', name: 'Uva da tavola' };

    it('should create a new product', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue(mockProduct);

      const result = await service.create(createDto);

      expect(result.id).toBe(mockProduct.id);
      expect(result.code).toBe(mockProduct.code);
      expect(result.name).toBe(mockProduct.name);
      expect(prisma.product.create).toHaveBeenCalledWith({ data: createDto });
    });

    it('should throw ConflictException if code exists', async () => {
      prisma.product.findFirst.mockResolvedValue(mockProduct);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct]);
      prisma.product.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findAllActive', () => {
    it('should return all active products without pagination', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct]);

      const result = await service.findAllActive();

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockProduct.id);
    });
  });

  describe('findById', () => {
    it('should return product by id', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findById('product-id-1');

      expect(result.id).toBe('product-id-1');
    });

    it('should throw NotFoundException if product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = { name: 'Uva aggiornata' };

    it('should update product', async () => {
      prisma.product.findUnique.mockResolvedValueOnce(mockProduct);
      prisma.product.update.mockResolvedValue({ ...mockProduct, name: 'Uva aggiornata' });

      const result = await service.update('product-id-1', updateDto);

      expect(result.name).toBe('Uva aggiornata');
    });

    it('should throw NotFoundException if product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete (soft delete)', () => {
    it('should soft delete product', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue({ ...mockProduct, deletedAt: new Date() });

      await service.delete('product-id-1');

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-id-1' },
        data: {
          deletedAt: expect.any(Date),
          code: expect.stringMatching(/^UVA_del_\d+$/),
        },
      });
    });

    it('should keep renamed soft-delete code within 32 chars', async () => {
      const longCodeProduct = { ...mockProduct, code: 'ABCDEFGHIJKLMN' };
      prisma.product.findUnique.mockResolvedValue(longCodeProduct);
      prisma.product.update.mockImplementation(async (args: { data: { code: string } }) => ({
        ...longCodeProduct,
        deletedAt: new Date(),
        code: args.data.code,
      }));

      await service.delete('product-id-1');

      const updateArgs = prisma.product.update.mock.calls[0][0];
      expect(updateArgs.data.code.length).toBeLessThanOrEqual(32);
    });
  });

  describe('restore', () => {
    it('should restore deleted product', async () => {
      const deletedProduct = { ...mockProduct, code: 'UVA_del_1700000000000', deletedAt: new Date() };
      prisma.product.findUnique.mockResolvedValue(deletedProduct);
      prisma.product.findFirst.mockResolvedValue(null);
      prisma.product.update.mockResolvedValue({ ...mockProduct, deletedAt: null });

      await service.restore('product-id-1');

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-id-1' },
        data: { deletedAt: null, code: 'UVA' },
      });
    });

    it('should throw ConflictException if original code is used by active product', async () => {
      const deletedProduct = { ...mockProduct, code: 'UVA_del_1700000000000', deletedAt: new Date() };
      prisma.product.findUnique.mockResolvedValue(deletedProduct);
      prisma.product.findFirst.mockResolvedValue({ ...mockProduct, id: 'product-id-2', code: 'UVA' });

      await expect(service.restore('product-id-1')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if product not deleted', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      await expect(service.restore('product-id-1')).rejects.toThrow(ConflictException);
    });
  });
});
