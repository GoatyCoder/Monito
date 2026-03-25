import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePackagingDto, UpdatePackagingDto, PackagingResponseDto } from './dto';
import { PaginationDto, getPaginationParams } from '../../common/dto/pagination.dto';
import { QueryFiltersDto } from '../../common/dto/query-filters.dto';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { AuditQueueService } from '../../common/events/audit-queue.service';
import { AuditOperation } from '../audit/dto/create-audit-log.dto';
import { Prisma } from '../../../generated/prisma/client';

export const ENTITY_NAME = 'Packaging';

@Injectable()
export class PackagingsService {
  private readonly logger = new Logger(PackagingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditQueue: AuditQueueService,
  ) {}

  async create(dto: CreatePackagingDto, userId?: string): Promise<PackagingResponseDto> {
    const existing = await this.prisma.packaging.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Packaging with this code already exists');
    }

    const packaging = await this.prisma.packaging.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
      },
    });

    this.logger.log(`Packaging created: ${packaging.id}`);
    
    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: packaging.id,
      operation: AuditOperation.CREATE,
      newValue: dto as unknown as Record<string, unknown>,
    });

    return this.toResponse(packaging);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters: QueryFiltersDto,
  ): Promise<PaginatedResponse<PackagingResponseDto>> {
    const { skip, take } = getPaginationParams(paginationDto);
    const where: Prisma.PackagingWhereInput = {};

    if (!filters.includeDeleted) {
      where.deletedAt = null;
    }

    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search } },
        { name: { contains: filters.search } },
      ];
    }

    const [packagings, total] = await this.prisma.$transaction([
      this.prisma.packaging.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.packaging.count({ where }),
    ]);

    return {
      data: packagings.map((p) => this.toResponse(p)),
      meta: {
        total,
        page: paginationDto.page ?? 1,
        limit: paginationDto.limit ?? 20,
        totalPages: Math.ceil(total / (paginationDto.limit ?? 20)),
      },
    };
  }

  async findById(id: string, includeDeleted = false): Promise<PackagingResponseDto> {
    const where: Prisma.PackagingWhereUniqueInput = { id };
    const packaging = await this.prisma.packaging.findUnique({
      where: includeDeleted ? where : { ...where, deletedAt: null },
    });

    if (!packaging) {
      throw new NotFoundException(`Packaging with ID ${id} not found`);
    }

    return this.toResponse(packaging);
  }

  async update(id: string, dto: UpdatePackagingDto, userId?: string): Promise<PackagingResponseDto> {
    const packaging = await this.prisma.packaging.findUnique({
      where: { id, deletedAt: null },
    });

    if (!packaging) {
      throw new NotFoundException(`Packaging with ID ${id} not found`);
    }

    if (dto.code && dto.code !== packaging.code) {
      const existing = await this.prisma.packaging.findUnique({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException('Packaging with this code already exists');
      }
    }

    const oldValue = this.toResponse(packaging);
    const updated = await this.prisma.packaging.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`Packaging updated: ${id}`);
    
    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: id,
      operation: AuditOperation.UPDATE,
      oldValue: oldValue as unknown as Record<string, unknown>,
      newValue: dto as unknown as Record<string, unknown>,
    });

    return this.toResponse(updated);
  }

  async delete(id: string, force = false, userId?: string): Promise<void> {
    const packaging = await this.prisma.packaging.findUnique({
      where: { id },
    });

    if (!packaging) {
      throw new NotFoundException(`Packaging with ID ${id} not found`);
    }

    if (force) {
      await this.prisma.packaging.delete({
        where: { id },
      });

      this.logger.log(`Packaging hard deleted: ${id}`);
      
      this.auditQueue.push({
        userId,
        entity: ENTITY_NAME,
        entityId: id,
        operation: AuditOperation.HARD_DELETE,
        oldValue: this.toResponse(packaging) as unknown as Record<string, unknown>,
      });
    } else {
      const oldValue = this.toResponse(packaging);
      await this.prisma.packaging.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      this.logger.log(`Packaging soft deleted: ${id}`);
      
      this.auditQueue.push({
        userId,
        entity: ENTITY_NAME,
        entityId: id,
        operation: AuditOperation.SOFT_DELETE,
        oldValue: oldValue as unknown as Record<string, unknown>,
      });
    }
  }

  async restore(id: string, userId?: string): Promise<PackagingResponseDto> {
    const packaging = await this.prisma.packaging.findUnique({
      where: { id },
    });

    if (!packaging) {
      throw new NotFoundException(`Packaging with ID ${id} not found`);
    }

    if (!packaging.deletedAt) {
      throw new NotFoundException(`Packaging with ID ${id} is not deleted`);
    }

    const updated = await this.prisma.packaging.update({
      where: { id },
      data: { deletedAt: null },
    });

    this.logger.log(`Packaging restored: ${id}`);
    
    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: id,
      operation: AuditOperation.RESTORE,
      oldValue: { ...this.toResponse(packaging), deletedAt: packaging.deletedAt } as unknown as Record<string, unknown>,
      newValue: this.toResponse(updated) as unknown as Record<string, unknown>,
    });

    return this.toResponse(updated);
  }

  private toResponse(packaging: { id: string; code: string; name: string; description: string | null; createdAt: Date; updatedAt: Date; deletedAt?: Date | null }) {
    return {
      id: packaging.id,
      code: packaging.code,
      name: packaging.name,
      description: packaging.description,
      createdAt: packaging.createdAt,
      updatedAt: packaging.updatedAt,
      deletedAt: packaging.deletedAt ?? null,
    };
  }
}
