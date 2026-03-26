import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../../../generated/prisma/client';
import { AuditQueueService } from '../../common/events/audit-queue.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedpassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = {
    id: 'user-id-1',
    username: 'testuser',
    password: 'hashedpassword',
    firstName: 'Test',
    surname: 'User',
    role: Role.USER,
    isActive: true,
    mustChangePassword: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((arg: ((tx: typeof mockPrisma) => Promise<unknown>) | unknown[]) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return arg(mockPrisma as unknown as PrismaService);
    }),
  } as unknown as PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'bcrypt.saltRounds') return 12;
              return null;
            }),
          },
        },
        {
          provide: AuditQueueService,
          useValue: {
            push: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      username: 'newuser',
      password: 'password123',
      firstName: 'New',
      surname: 'User',
    };

    it('should create a new user', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);
      mockPrisma.user.create = jest.fn().mockResolvedValue(mockUser);

      const result = await service.create(createDto);

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          username: mockUser.username,
          firstName: mockUser.firstName,
          surname: mockUser.surname,
          role: mockUser.role,
          isActive: mockUser.isActive,
          mustChangePassword: mockUser.mustChangePassword,
          avatarColor: undefined,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
        temporaryPassword: expect.any(String),
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { username: 'newuser' } });
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if username exists', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      mockPrisma.user.findMany = jest.fn().mockResolvedValue([mockUser]);
      mockPrisma.user.count = jest.fn().mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);

      const result = await service.findById('user-id-1');

      expect(result.id).toBe('user-id-1');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = {
      firstName: 'Updated',
    };

    it('should update user', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValueOnce(mockUser);
      mockPrisma.user.update = jest.fn().mockResolvedValue({
        ...mockUser,
        firstName: 'Updated',
      });

      const result = await service.update('user-id-1', updateDto);

      expect(result.firstName).toBe('Updated');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if username already exists', async () => {
      mockPrisma.user.findUnique = jest.fn()
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ id: 'other-user', username: 'taken' });

      await expect(
        service.update('user-id-1', { username: 'taken' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should prevent self admin demotion', async () => {
      const adminUser = { ...mockUser, role: Role.ADMIN, isActive: true };
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(adminUser);

      await expect(
        service.update('user-id-1', { role: Role.USER }, 'user-id-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should prevent demoting last active admin', async () => {
      const adminUser = { ...mockUser, role: Role.ADMIN, isActive: true };
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(adminUser);
      mockPrisma.user.count = jest.fn().mockResolvedValue(1);

      await expect(
        service.update('user-id-1', { role: Role.USER }, 'admin-2'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateStatus', () => {
    it('should prevent self admin deactivation', async () => {
      const adminUser = { ...mockUser, role: Role.ADMIN, isActive: true };
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(adminUser);

      await expect(
        service.updateStatus('user-id-1', { isActive: false }, 'user-id-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should prevent deactivation of last active admin', async () => {
      const adminUser = { ...mockUser, role: Role.ADMIN, isActive: true };
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(adminUser);
      mockPrisma.user.count = jest.fn().mockResolvedValue(1);

      await expect(
        service.updateStatus('user-id-1', { isActive: false }, 'admin-2'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      mockPrisma.user.delete = jest.fn().mockResolvedValue(mockUser);

      await service.delete('user-id-1');

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-id-1' } });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should prevent self admin deletion', async () => {
      const adminUser = { ...mockUser, role: Role.ADMIN, isActive: true };
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(adminUser);

      await expect(service.delete('user-id-1', 'user-id-1')).rejects.toThrow(ConflictException);
    });

    it('should prevent deletion of last active admin', async () => {
      const adminUser = { ...mockUser, role: Role.ADMIN, isActive: true };
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(adminUser);
      mockPrisma.user.count = jest.fn().mockResolvedValue(1);

      await expect(service.delete('user-id-1', 'admin-2')).rejects.toThrow(ConflictException);
    });
  });
});
