jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    lazyConnect: jest.fn(),
  }));
});

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../../../generated/prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock } };
  let jwtService: { sign: jest.Mock; verify: jest.Mock };

  const mockUser = {
    id: 'user-id-1',
    username: 'testuser',
    password: 'hashedpassword',
    firstName: 'Test',
    surname: 'User',
    role: Role.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
      verify: jest.fn().mockReturnValue({ sub: 'user-id-1', username: 'testuser', role: Role.USER, exp: Date.now() + 3600000 }),
    };

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
              if (key === 'redis.host') return 'localhost';
              if (key === 'redis.port') return 6379;
              if (key === 'redis.password') return undefined;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto = { username: 'testuser', password: 'password123' };

    it('should return access and refresh tokens on successful login', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { username: 'testuser' } });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should return new tokens on valid refresh token', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.refresh('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException on invalid refresh token', async () => {
      jwtService.verify.mockImplementation(() => { throw new Error('Invalid token'); });

      await expect(service.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should not throw on logout', async () => {
      await expect(service.logout('some-token')).resolves.not.toThrow();
    });
  });
});
