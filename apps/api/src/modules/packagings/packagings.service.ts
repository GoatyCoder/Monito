import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePackagingDto, UpdatePackagingDto, PackagingResponseDto } from './dto';
import { getPaginationParams } from '../../common/dto/pagination.dto';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { AuditQueueService } from '../../common/events/audit-queue.service';
import { AuditOperation } from '../audit/dto/create-audit-log.dto';
import { Prisma } from '../../../generated/prisma/client';

export const ENTITY_NAME = 'Packaging';
const CODE_DB_MAX_LENGTH = 32;
const CODE_SOFT_DELETE_SUFFIX_PREFIX = '_del_';

@Injectable()
export class PackagingsService {
  private readonly logger = new Logger(PackagingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditQueue: AuditQueueService,
  ) {}

  async create(dto: CreatePackagingDto, userId?: string): Promise<PackagingResponseDto> {
    const existing = await this.prisma.packaging.findFirst({
      where: {
        code: dto.code,
        deletedAt: null,
      },
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
    dto: ListQueryDto,
  ): Promise<PaginatedResponse<PackagingResponseDto>> {
    const { skip, take } = getPaginationParams(dto);
    const where: Prisma.PackagingWhereInput = { deletedAt: null };

    if (dto.search) {
      where.OR = [
        { code: { contains: dto.search } },
        { name: { contains: dto.search } },
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
        page: dto.page ?? 1,
        limit: dto.limit ?? 20,
        totalPages: Math.ceil(total / (dto.limit ?? 20)),
      },
    };
  }

  async findAllActive(): Promise<PackagingResponseDto[]> {
    const packagings = await this.prisma.packaging.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });

    return packagings.map((packaging) => this.toResponse(packaging));
  }

  async findDeleted(
    dto: ListQueryDto,
  ): Promise<PaginatedResponse<PackagingResponseDto>> {
    const { skip, take } = getPaginationParams(dto);
    const where: Prisma.PackagingWhereInput = { deletedAt: { not: null } };

    if (dto.search) {
      where.OR = [{ code: { contains: dto.search } }, { name: { contains: dto.search } }];
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
        page: dto.page ?? 1,
        limit: dto.limit ?? 20,
        totalPages: Math.ceil(total / (dto.limit ?? 20)),
      },
    };
  }

  async findById(id: string): Promise<PackagingResponseDto> {
    const packaging = await this.prisma.packaging.findUnique({
      where: { id, deletedAt: null },
    });

    if (!packaging) {
      throw new NotFoundException(`Packaging with ID ${id} not found`);
    }

    return this.toResponse(packaging);
  }

  async findDeletedById(id: string): Promise<PackagingResponseDto> {
    const packaging = await this.prisma.packaging.findUnique({
      where: { id, deletedAt: { not: null } },
    });

    if (!packaging) {
      throw new NotFoundException(`Soft-deleted packaging with ID ${id} not found`);
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
      const existing = await this.prisma.packaging.findFirst({
        where: {
          code: dto.code,
          deletedAt: null,
          NOT: { id },
        },
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

  async delete(id: string, userId?: string): Promise<void> {
    const packaging = await this.prisma.packaging.findUnique({
      where: { id, deletedAt: null },
    });

    if (!packaging) {
      const deletedPackaging = await this.prisma.packaging.findUnique({ where: { id } });
      if (deletedPackaging?.deletedAt) {
        throw new ConflictException(`Packaging with ID ${id} is already deleted`);
      }

      throw new NotFoundException(`Packaging with ID ${id} not found`);
    }

    const oldValue = this.toResponse(packaging);
    const deletedCode = this.buildSoftDeletedCode(packaging.code);
    await this.prisma.packaging.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        code: deletedCode,
      },
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

  async restore(id: string, userId?: string): Promise<PackagingResponseDto> {
    const packaging = await this.prisma.packaging.findUnique({
      where: { id },
    });

    if (!packaging) {
      throw new NotFoundException(`Packaging with ID ${id} not found`);
    }

    if (!packaging.deletedAt) {
      throw new ConflictException(`Packaging with ID ${id} is not deleted`);
    }

    const originalCode = this.extractOriginalCode(packaging.code);
    const activeWithOriginalCode = await this.prisma.packaging.findFirst({
      where: {
        code: originalCode,
        deletedAt: null,
        NOT: { id },
      },
    });

    if (activeWithOriginalCode) {
      throw new ConflictException(
        `Cannot restore packaging with ID ${id}: code ${originalCode} is already used by an active packaging`,
      );
    }

    const updated = await this.prisma.packaging.update({
      where: { id },
      data: {
        deletedAt: null,
        code: originalCode,
      },
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

  async purge(id: string, reason: string, userId?: string): Promise<void> {
    const packaging = await this.prisma.packaging.findUnique({ where: { id } });

    if (!packaging) {
      throw new NotFoundException(`Packaging with ID ${id} not found`);
    }

    if (!packaging.deletedAt) {
      throw new ConflictException(`Packaging with ID ${id} must be soft-deleted before purge`);
    }

    const linkedPalletItems = await this.prisma.palletItem.count({ where: { packagingId: id } });
    if (linkedPalletItems > 0) {
      throw new ConflictException('Cannot purge packaging because it is still referenced by pallet items');
    }

    await this.prisma.packaging.delete({ where: { id } });

    this.logger.log(`Packaging purged: ${id}`);

    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: id,
      operation: AuditOperation.HARD_DELETE,
      oldValue: this.toResponse(packaging) as unknown as Record<string, unknown>,
      newValue: { reason },
    });
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

  private buildSoftDeletedCode(code: string): string {
    const suffix = `${CODE_SOFT_DELETE_SUFFIX_PREFIX}${Date.now()}`;
    const originalMaxLength = CODE_DB_MAX_LENGTH - suffix.length;
    const safeCode = code.slice(0, originalMaxLength);
    return `${safeCode}${suffix}`;
  }

  private extractOriginalCode(code: string): string {
    const markerIndex = code.indexOf(CODE_SOFT_DELETE_SUFFIX_PREFIX);
    if (markerIndex < 0) {
      return code;
    }

    return code.slice(0, markerIndex);
  }
}
