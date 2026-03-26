import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppRole, RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const guard = new RolesGuard(reflector);

  const createContext = (userRole?: AppRole): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: userRole ? { role: userRole } : undefined }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows request when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows request when user has a required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

    expect(guard.canActivate(createContext('ADMIN'))).toBe(true);
  });

  it('denies request when user does not have a required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

    expect(guard.canActivate(createContext('USER'))).toBe(false);
  });

  it('denies request when user is missing and roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

    expect(guard.canActivate(createContext())).toBe(false);
  });
});
