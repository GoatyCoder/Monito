import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AvatarColor, Role } from '../../../generated/prisma/client';
import {
  CreateUserDto,
  UpdateMeDto,
  UpdateUserDto,
  UpdateUserPreferencesDto,
  UserPreferencesResponseDto,
  UserResponseDto,
} from './dto';
import { PaginationDto, getPaginationParams } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existing) {
      throw new ConflictException('User with this username already exists');
    }

    const saltRounds = this.configService.get<number>('bcrypt.saltRounds') ?? 12;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        password: hashedPassword,
        firstName: dto.firstName,
        surname: dto.surname,
        role: dto.role,
      },
    });

    this.logger.log(`User created: ${user.id}`);
    return this.toResponse(user);
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
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.toResponse(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    return this.updateUserData(id, dto);
  }

  async updateMe(id: string, dto: UpdateMeDto): Promise<UserResponseDto> {
    return this.updateUserData(id, dto);
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
      },
    });

    return this.toPreferencesResponse(updated);
  }

  private async updateUserData(id: string, dto: UpdateUserDto | UpdateMeDto): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (dto.username && dto.username !== user.username) {
      const existing = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (existing) {
        throw new ConflictException('User with this username already exists');
      }
    }

    const data: Record<string, unknown> = {};
    if (dto.username) data.username = dto.username;
    if (dto.firstName) data.firstName = dto.firstName;
    if (dto.surname) data.surname = dto.surname;
    if ('role' in dto && dto.role) data.role = dto.role;
    if ('avatarColor' in dto && dto.avatarColor) data.avatarColor = dto.avatarColor;
    if ('password' in dto && dto.password) {
      const saltRounds = this.configService.get<number>('bcrypt.saltRounds') ?? 12;
      data.password = await bcrypt.hash(dto.password, saltRounds);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });

    this.logger.log(`User updated: ${id}`);
    return this.toResponse(updated);
  }

  async delete(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.prisma.user.delete({
      where: { id },
    });

    this.logger.log(`User deleted: ${id}`);
  }

  private async ensureUserExists(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
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
      },
    });
  }

  private toPreferencesResponse(preferences: {
    masterDataPageSize: number;
    auditLogPageSize: number;
  }): UserPreferencesResponseDto {
    return {
      masterDataPageSize: preferences.masterDataPageSize as 10 | 20 | 50 | 100,
      auditLogPageSize: preferences.auditLogPageSize as 10 | 20 | 50 | 100,
    };
  }

  private toResponse(user: {
    id: string;
    username: string;
    firstName: string;
    surname: string;
    role: Role;
    avatarColor?: AvatarColor | null;
    createdAt: Date;
    updatedAt?: Date;
  }) {
    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      surname: user.surname,
      role: user.role,
      avatarColor: user.avatarColor ? user.avatarColor.toLowerCase() : undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
