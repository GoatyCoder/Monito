import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditOperation } from './dto/create-audit-log.dto';

describe('AuditService', () => {
  let service: AuditService;

  const mockAuditLog = {
    id: 'audit-id-1',
    userId: 'user-id-1',
    entity: 'Product',
    entityId: 'cm9xkz4ph0000abcde1234567',
    operation: AuditOperation.CREATE,
    oldValue: null,
    newValue: JSON.stringify({ code: 'P001', name: 'Olive Oil' }),
    ipAddress: '127.0.0.1',
    userAgent: 'jest',
    timestamp: new Date('2025-01-01T00:00:00.000Z'),
  };

  const mockPrisma = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('creates and returns an audit log', async () => {
      mockPrisma.auditLog.create.mockResolvedValue(mockAuditLog);

      const dto = {
        userId: 'user-id-1',
        entity: 'Product',
        entityId: 'cm9xkz4ph0000abcde1234567',
        operation: AuditOperation.CREATE,
        newValue: { code: 'P001', name: 'Olive Oil' },
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      };

      const result = await service.log(dto);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: dto.userId,
          entity: dto.entity,
          entityId: dto.entityId,
          operation: dto.operation,
          oldValue: null,
          newValue: JSON.stringify(dto.newValue),
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
        },
      });
      expect(result.newValue).toEqual({ code: 'P001', name: 'Olive Oil' });
    });
  });

  describe('findAll', () => {
    it('returns paginated audit logs with meta', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([mockAuditLog]);
      mockPrisma.auditLog.count.mockResolvedValue(1);
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'user-id-1',
          username: 'mrossi',
          firstName: 'Mario',
          surname: 'Rossi',
        },
      ]);

      const result = await service.findAll({
        entity: 'Product',
        page: 1,
        limit: 20,
      });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { entity: 'Product' },
        skip: 0,
        take: 20,
        orderBy: { timestamp: 'desc' },
      });
      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('applies date filters and operation filter', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);
      mockPrisma.user.findMany.mockResolvedValue([]);

      const startDate = new Date('2025-01-01T00:00:00.000Z');
      const endDate = new Date('2025-01-31T23:59:59.000Z');

      await service.findAll({
        operation: AuditOperation.UPDATE,
        startDate,
        endDate,
        page: 2,
        limit: 10,
      });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          operation: AuditOperation.UPDATE,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        skip: 10,
        take: 10,
        orderBy: { timestamp: 'desc' },
      });
    });

    it('maps null JSON payloads safely', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([
        {
          ...mockAuditLog,
          oldValue: null,
          newValue: null,
        },
      ]);
      mockPrisma.auditLog.count.mockResolvedValue(1);
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await service.findAll({});

      expect(result.data[0].oldValue).toBeNull();
      expect(result.data[0].newValue).toBeNull();
    });
  });
});
