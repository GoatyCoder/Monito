import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AvatarColor, Role } from '../../../generated/prisma/client';
import {
  CreateUserResponseDto,
  CreateUserDto,
  ResetUserPasswordResponseDto,
  UpdateMeDto,
  UpdateUserStatusDto,
  UpdateUserDto,
  UpdateUserPreferencesDto,
  UserPreferencesResponseDto,
  UserResponseDto,
} from './dto';
import { PaginationDto, getPaginationParams } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { AuditQueueService } from '../../common/events/audit-queue.service';
import { AuditOperation } from '../audit/dto/create-audit-log.dto';
import { ErrorCodes } from '../../common/errors/error-codes';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditQueue: AuditQueueService,
  ) {}

  async create(dto: CreateUserDto): Promise<CreateUserResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existing) {
      throw new ConflictException({
        code: ErrorCodes.USER_ALREADY_EXISTS,
        message: 'User with this username already exists',
      });
    }

    const temporaryPassword = dto.password ?? this.generateTemporaryPassword();
    const saltRounds = this.configService.get<number>('bcrypt.saltRounds') ?? 12;
    const hashedPassword = await bcrypt.hash(temporaryPassword, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        password: hashedPassword,
        firstName: dto.firstName,
        surname: dto.surname,
        role: dto.role,
        mustChangePassword: true,
        isActive: true,
      },
    });

    this.logger.log(`User created: ${user.id}`);
    this.auditQueue.push({
      entity: 'User',
      entityId: user.id,
      operation: AuditOperation.CREATE,
      newValue: {
        username: user.username,
        role: user.role,
        isActive: user.isActive,
      },
    });
    return {
      user: this.toResponse(user),
      temporaryPassword,
    };
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponse<UserResponseDto>> {
    const { skip, take } = getPaginationParams(paginationDto);

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users.map((u) => this.toResponse(u)),
      meta: {
        total,
        page: paginationDto.page ?? 1,
        limit: paginationDto.limit ?? 20,
        totalPages: Math.ceil(total / (paginationDto.limit ?? 20)),
      },
    };
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException({
        code: ErrorCodes.USER_NOT_FOUND,
        message: `User with ID ${id} not found`,
      });
    }

    return this.toResponse(user);
  }

  async update(id: string, dto: UpdateUserDto, actorUserId?: string): Promise<UserResponseDto> {
    return this.updateUserData(id, dto, actorUserId);
  }

  async updateMe(id: string, dto: UpdateMeDto): Promise<UserResponseDto> {
    return this.updateUserData(id, dto, id);
  }

  async getMePreferences(id: string): Promise<UserPreferencesResponseDto> {
    const preferences = await this.getOrCreatePreferences(id);
    return this.toPreferencesResponse(preferences);
  }

  async updateMePreferences(
    id: string,
    dto: UpdateUserPreferencesDto,
  ): Promise<UserPreferencesResponseDto> {
    await this.ensureUserExists(id);

    const current = await this.getOrCreatePreferences(id);
    const updated = await this.prisma.userPreferences.update({
      where: { id: current.id },
      data: {
        masterDataPageSize: dto.masterDataPageSize ?? current.masterDataPageSize,
        auditLogPageSize: dto.auditLogPageSize ?? current.auditLogPageSize,
        lockScreenEnabled: dto.lockScreenEnabled ?? current.lockScreenEnabled,
        lockScreenTimeoutMinutes:
          dto.lockScreenTimeoutMinutes ?? current.lockScreenTimeoutMinutes,
      },
    });

    this.auditQueue.push({
      userId: id,
      entity: 'UserPreferences',
      entityId: current.id,
      operation: AuditOperation.UPDATE,
      oldValue: {
        masterDataPageSize: current.masterDataPageSize,
        auditLogPageSize: current.auditLogPageSize,
        lockScreenEnabled: current.lockScreenEnabled,
        lockScreenTimeoutMinutes: current.lockScreenTimeoutMinutes,
      },
      newValue: {
        masterDataPageSize: updated.masterDataPageSize,
        auditLogPageSize: updated.auditLogPageSize,
        lockScreenEnabled: updated.lockScreenEnabled,
        lockScreenTimeoutMinutes: updated.lockScreenTimeoutMinutes,
      },
    });

    return this.toPreferencesResponse(updated);
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto, actorUserId?: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException({
        code: ErrorCodes.USER_NOT_FOUND,
        message: `User with ID ${id} not found`,
      });
    }

    await this.ensureAdminCanBeDeactivated(user, dto.isActive, actorUserId);

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        isActive: dto.isActive,
      },
    });

    this.auditQueue.push({
      userId: actorUserId,
      entity: 'User',
      entityId: id,
      operation: AuditOperation.STATUS_CHANGE,
      oldValue: { isActive: user.isActive },
      newValue: { isActive: updated.isActive },
    });

    return this.toResponse(updated);
  }

  async resetPassword(id: string, actorUserId?: string): Promise<ResetUserPasswordResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException({
        code: ErrorCodes.USER_NOT_FOUND,
        message: `User with ID ${id} not found`,
      });
    }

    const temporaryPassword = this.generateTemporaryPassword();
    const saltRounds = this.configService.get<number>('bcrypt.saltRounds') ?? 12;
    const password = await bcrypt.hash(temporaryPassword, saltRounds);

    await this.prisma.user.update({
      where: { id },
      data: {
        password,
        mustChangePassword: true,
      },
    });

    this.auditQueue.push({
      userId: actorUserId,
      entity: 'User',
      entityId: id,
      operation: AuditOperation.RESET_PASSWORD,
    });

    return { temporaryPassword };
  }

  private async updateUserData(
    id: string,
    dto: UpdateUserDto | UpdateMeDto,
    actorUserId?: string,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException({
        code: ErrorCodes.USER_NOT_FOUND,
        message: `User with ID ${id} not found`,
      });
    }

    if (dto.username && dto.username !== user.username) {
      const existing = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (existing) {
        throw new ConflictException({
          code: ErrorCodes.USER_ALREADY_EXISTS,
          message: 'User with this username already exists',
        });
      }
    }

    if ('role' in dto && dto.role && dto.role !== user.role) {
      await this.ensureAdminRoleCanBeChanged(user, dto.role, actorUserId);
    }

    const data: Record<string, unknown> = {};
    if (dto.username) data.username = dto.username;
    if (dto.firstName) data.firstName = dto.firstName;
    if (dto.surname) data.surname = dto.surname;
    if ('role' in dto && dto.role) data.role = dto.role;
    if ('avatarColor' in dto && dto.avatarColor) data.avatarColor = dto.avatarColor;

    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });

    this.logger.log(`User updated: ${id}`);

    this.auditQueue.push({
      userId: actorUserId,
      entity: 'User',
      entityId: id,
      operation: AuditOperation.UPDATE,
      oldValue: {
        username: user.username,
        firstName: user.firstName,
        surname: user.surname,
        role: user.role,
      },
      newValue: {
        username: updated.username,
        firstName: updated.firstName,
        surname: updated.surname,
        role: updated.role,
      },
    });

    return this.toResponse(updated);
  }

  async delete(id: string, actorUserId?: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException({
        code: ErrorCodes.USER_NOT_FOUND,
        message: `User with ID ${id} not found`,
      });
    }

    await this.ensureAdminCanBeDeleted(user, actorUserId);

    await this.prisma.user.delete({
      where: { id },
    });

    this.auditQueue.push({
      userId: actorUserId,
      entity: 'User',
      entityId: id,
      operation: AuditOperation.HARD_DELETE,
      oldValue: {
        username: user.username,
        role: user.role,
        isActive: user.isActive,
      },
    });

    this.logger.log(`User deleted: ${id}`);
  }

  private async ensureAdminCanBeDeactivated(
    user: { id: string; role: Role; isActive: boolean },
    nextIsActive: boolean,
    actorUserId?: string,
  ): Promise<void> {
    if (user.role !== Role.ADMIN || !user.isActive || nextIsActive) {
      return;
    }

    if (actorUserId && user.id === actorUserId) {
      throw new ConflictException({
        code: ErrorCodes.USER_SELF_ADMIN_DEACTIVATE,
        message: 'You cannot deactivate your own account',
      });
    }

    const activeAdmins = await this.countActiveAdmins();
    if (activeAdmins <= 1) {
      throw new ConflictException({
        code: ErrorCodes.USER_LAST_ACTIVE_ADMIN_DEACTIVATE,
        message: 'Cannot deactivate the last active admin',
      });
    }
  }

  private async ensureAdminRoleCanBeChanged(
    user: { id: string; role: Role; isActive: boolean },
    nextRole: Role,
    actorUserId?: string,
  ): Promise<void> {
    if (user.role !== Role.ADMIN || nextRole === Role.ADMIN || !user.isActive) {
      return;
    }

    if (actorUserId && user.id === actorUserId) {
      throw new ConflictException({
        code: ErrorCodes.USER_SELF_ADMIN_ROLE_CHANGE,
        message: 'You cannot change your own admin role',
      });
    }

    const activeAdmins = await this.countActiveAdmins();
    if (activeAdmins <= 1) {
      throw new ConflictException({
        code: ErrorCodes.USER_LAST_ACTIVE_ADMIN_ROLE_CHANGE,
        message: 'Cannot remove the last active admin role',
      });
    }
  }

  private async ensureAdminCanBeDeleted(
    user: { id: string; role: Role; isActive: boolean },
    actorUserId?: string,
  ): Promise<void> {
    if (user.role !== Role.ADMIN || !user.isActive) {
      return;
    }

    if (actorUserId && user.id === actorUserId) {
      throw new ConflictException({
        code: ErrorCodes.USER_SELF_DELETE,
        message: 'You cannot delete your own account',
      });
    }

    const activeAdmins = await this.countActiveAdmins();
    if (activeAdmins <= 1) {
      throw new ConflictException({
        code: ErrorCodes.USER_LAST_ACTIVE_ADMIN_DELETE,
        message: 'Cannot delete the last active admin',
      });
    }
  }

  private async countActiveAdmins(): Promise<number> {
    return this.prisma.user.count({
      where: {
        role: Role.ADMIN,
        isActive: true,
      },
    });
  }

  private async ensureUserExists(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException({
        code: ErrorCodes.USER_NOT_FOUND,
        message: `User with ID ${id} not found`,
      });
    }
  }

  private async getOrCreatePreferences(id: string) {
    await this.ensureUserExists(id);

    const existing = await this.prisma.userPreferences.findUnique({
      where: { userId: id },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.userPreferences.create({
      data: {
        userId: id,
        masterDataPageSize: 20,
        auditLogPageSize: 20,
        lockScreenEnabled: true,
        lockScreenTimeoutMinutes: 5,
      },
    });
  }

  private toPreferencesResponse(preferences: {
    masterDataPageSize: number;
    auditLogPageSize: number;
    lockScreenEnabled: boolean;
    lockScreenTimeoutMinutes: number;
  }): UserPreferencesResponseDto {
    return {
      masterDataPageSize: preferences.masterDataPageSize as 10 | 20 | 50 | 100,
      auditLogPageSize: preferences.auditLogPageSize as 10 | 20 | 50 | 100,
      lockScreenEnabled: preferences.lockScreenEnabled,
      lockScreenTimeoutMinutes: preferences.lockScreenTimeoutMinutes,
    };
  }

  private toResponse(user: {
    id: string;
    username: string;
    firstName: string;
    surname: string;
    role: Role;
    avatarColor?: AvatarColor | null;
    isActive: boolean;
    mustChangePassword: boolean;
    createdAt: Date;
    updatedAt?: Date;
    lastLoginAt?: Date | null;
  }) {
    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      surname: user.surname,
      role: user.role,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      avatarColor: user.avatarColor ? user.avatarColor.toLowerCase() : undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt ?? null,
    };
  }

  private generateTemporaryPassword(length = 10): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let output = '';

    for (let i = 0; i < length; i += 1) {
      const index = Math.floor(Math.random() * alphabet.length);
      output += alphabet[index];
    }

    return output;
  }
}
