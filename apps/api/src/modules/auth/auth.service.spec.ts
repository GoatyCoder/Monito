jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../../../generated/prisma/client';
import { AuditQueueService } from '../../common/events/audit-queue.service';

type MockRedisClient = {
  get: jest.Mock;
  set: jest.Mock;
};

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'user-id-1',
    username: 'testuser',
    password: 'hashedpassword',
    firstName: 'Test',
    surname: 'User',
    role: Role.USER,
    isActive: true,
    mustChangePassword: false,
    avatarColor: 'ORANGE',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-02T00:00:00.000Z'),
  };

  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const jwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'jwt.secret') return 'test-secret';
      if (key === 'jwt.refreshSecret') return 'test-refresh-secret';
      if (key === 'jwt.expiresIn') return '15m';
      if (key === 'jwt.refreshExpiresIn') return '7d';
      if (key === 'app.nodeEnv') return 'test';
      return undefined;
    }),
  };

  const redis: MockRedisClient = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const auditQueue = {
    push: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: redis,
        },
        {
          provide: AuditQueueService,
          useValue: auditQueue,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
    jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
    jwtService.verify.mockReturnValue({
      sub: mockUser.id,
      username: mockUser.username,
      role: mockUser.role,
      iat: 100,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    redis.get.mockResolvedValue(null);
    redis.set.mockResolvedValue('OK');
    prisma.user.findUnique.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  describe('login', () => {
    it('returns tokens and user profile for valid credentials', async () => {
      const result = await service.login({ username: 'testuser', password: 'password123' });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
        select: {
          id: true,
          username: true,
          password: true,
          firstName: true,
          surname: true,
          role: true,
          isActive: true,
          mustChangePassword: true,
          avatarColor: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: mockUser.id,
          username: mockUser.username,
          firstName: mockUser.firstName,
          surname: mockUser.surname,
          role: mockUser.role,
          isActive: mockUser.isActive,
          mustChangePassword: mockUser.mustChangePassword,
          avatarColor: 'orange',
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
      });
    });

    it('throws ForbiddenException when user is disabled', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ ...mockUser, isActive: false });

      await expect(service.login({ username: 'testuser', password: 'password123' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws UnauthorizedException when user is missing', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.login({ username: 'missing-user', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is invalid', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.login({ username: 'testuser', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('rotates refresh token and returns fresh tokens', async () => {
      const result = await service.refresh('valid-refresh-token');

      expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'test-refresh-secret',
      });
      expect(redis.set).toHaveBeenCalled();
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });

    it('throws UnauthorizedException when refresh token is revoked', async () => {
      redis.get.mockResolvedValueOnce('1');

      await expect(service.refresh('revoked-refresh-token')).rejects.toThrow(
        new UnauthorizedException('Token has been revoked'),
      );
    });

    it('throws UnauthorizedException when refresh token is invalid', async () => {
      jwtService.verify.mockImplementationOnce(() => {
        throw new Error('jwt malformed');
      });

      await expect(service.refresh('bad-refresh-token')).rejects.toThrow(
        new UnauthorizedException('Invalid refresh token'),
      );
    });

    it('throws UnauthorizedException when user from refresh token does not exist', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.refresh('refresh-for-deleted-user')).rejects.toThrow(
        new UnauthorizedException('User not found'),
      );
    });
  });

  describe('logout', () => {
    it('blacklists refresh token when it is valid', async () => {
      await service.logout('valid-refresh-token');

      expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'test-refresh-secret',
      });
      expect(redis.set).toHaveBeenCalled();
    });

    it('is idempotent when refresh token is invalid', async () => {
      jwtService.verify.mockImplementationOnce(() => {
        throw new Error('jwt malformed');
      });

      await expect(service.logout('bad-refresh-token')).resolves.not.toThrow();
      expect(redis.set).not.toHaveBeenCalled();
    });
  });

  describe('redis fallback', () => {
    it('still refreshes token when redis client is unavailable', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: PrismaService,
            useValue: prisma,
          },
          {
            provide: JwtService,
            useValue: jwtService,
          },
          {
            provide: ConfigService,
            useValue: configService,
          },
          {
            provide: 'REDIS_CLIENT',
            useValue: null,
          },
          {
            provide: AuditQueueService,
            useValue: auditQueue,
          },
        ],
      }).compile();

      const serviceWithoutRedis = module.get<AuthService>(AuthService);

      const result = await serviceWithoutRedis.refresh('valid-refresh-token');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });

    it('throws ServiceUnavailableException in production when redis is unavailable', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: PrismaService,
            useValue: prisma,
          },
          {
            provide: JwtService,
            useValue: jwtService,
          },
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'jwt.secret') return 'test-secret';
                if (key === 'jwt.refreshSecret') return 'test-refresh-secret';
                if (key === 'jwt.expiresIn') return '15m';
                if (key === 'jwt.refreshExpiresIn') return '7d';
                if (key === 'app.nodeEnv') return 'production';
                return undefined;
              }),
            },
          },
          {
            provide: 'REDIS_CLIENT',
            useValue: null,
          },
          {
            provide: AuditQueueService,
            useValue: auditQueue,
          },
        ],
      }).compile();

      const serviceWithoutRedis = module.get<AuthService>(AuthService);

      await expect(serviceWithoutRedis.refresh('valid-refresh-token')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });
});
