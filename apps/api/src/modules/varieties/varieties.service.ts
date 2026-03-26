import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVarietyDto, UpdateVarietyDto, VarietyResponseDto } from './dto';
import { getPaginationParams } from '../../common/dto/pagination.dto';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { AuditQueueService } from '../../common/events/audit-queue.service';
import { AuditOperation } from '../audit/dto/create-audit-log.dto';
import { Prisma } from '../../../generated/prisma/client';

export const ENTITY_NAME = 'Variety';

@Injectable()
export class VarietiesService {
  private readonly logger = new Logger(VarietiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditQueue: AuditQueueService,
  ) {}

  async create(dto: CreateVarietyDto, userId?: string): Promise<VarietyResponseDto> {
    const existing = await this.prisma.variety.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Variety with this code already exists');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }

    const variety = await this.prisma.variety.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        productId: dto.productId,
      },
    });

    this.logger.log(`Variety created: ${variety.id}`);
    
    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: variety.id,
      operation: AuditOperation.CREATE,
      newValue: dto as unknown as Record<string, unknown>,
    });

    return this.toResponse(variety);
  }

  async findAll(
    dto: ListQueryDto,
  ): Promise<PaginatedResponse<VarietyResponseDto>> {
    const { skip, take } = getPaginationParams(dto);
    const where: Prisma.VarietyWhereInput = { deletedAt: null };

    if (dto.productId) {
      where.productId = dto.productId;
    }

    if (dto.search) {
      where.OR = [
        { code: { contains: dto.search } },
        { name: { contains: dto.search } },
      ];
    }

    const [varieties, total] = await this.prisma.$transaction([
      this.prisma.variety.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.variety.count({ where }),
    ]);

    return {
      data: varieties.map((v) => this.toResponse(v)),
      meta: {
        total,
        page: dto.page ?? 1,
        limit: dto.limit ?? 20,
        totalPages: Math.ceil(total / (dto.limit ?? 20)),
      },
    };
  }

  async findDeleted(
    dto: ListQueryDto,
  ): Promise<PaginatedResponse<VarietyResponseDto>> {
    const { skip, take } = getPaginationParams(dto);
    const where: Prisma.VarietyWhereInput = { deletedAt: { not: null } };

    if (dto.productId) {
      where.productId = dto.productId;
    }

    if (dto.search) {
      where.OR = [{ code: { contains: dto.search } }, { name: { contains: dto.search } }];
    }

    const [varieties, total] = await this.prisma.$transaction([
      this.prisma.variety.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.variety.count({ where }),
    ]);

    return {
      data: varieties.map((v) => this.toResponse(v)),
      meta: {
        total,
        page: dto.page ?? 1,
        limit: dto.limit ?? 20,
        totalPages: Math.ceil(total / (dto.limit ?? 20)),
      },
    };
  }

  async findById(id: string): Promise<VarietyResponseDto> {
    const variety = await this.prisma.variety.findUnique({
      where: { id, deletedAt: null },
    });

    if (!variety) {
      throw new NotFoundException(`Variety with ID ${id} not found`);
    }

    return this.toResponse(variety);
  }

  async findDeletedById(id: string): Promise<VarietyResponseDto> {
    const variety = await this.prisma.variety.findUnique({
      where: { id, deletedAt: { not: null } },
    });

    if (!variety) {
      throw new NotFoundException(`Soft-deleted variety with ID ${id} not found`);
    }

    return this.toResponse(variety);
  }

  async findByProductId(productId: string): Promise<VarietyResponseDto[]> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const varieties = await this.prisma.variety.findMany({
      where: { productId, deletedAt: null },
      orderBy: { name: 'asc' },
    });

    return varieties.map((v) => this.toResponse(v));
  }

  async update(id: string, dto: UpdateVarietyDto, userId?: string): Promise<VarietyResponseDto> {
    const variety = await this.prisma.variety.findUnique({
      where: { id, deletedAt: null },
    });

    if (!variety) {
      throw new NotFoundException(`Variety with ID ${id} not found`);
    }

    if (dto.code && dto.code !== variety.code) {
      const existing = await this.prisma.variety.findUnique({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException('Variety with this code already exists');
      }
    }

    const oldValue = this.toResponse(variety);
    const updated = await this.prisma.variety.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`Variety updated: ${id}`);
    
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
    const variety = await this.prisma.variety.findUnique({
      where: { id, deletedAt: null },
    });

    if (!variety) {
      const deletedVariety = await this.prisma.variety.findUnique({ where: { id } });
      if (deletedVariety?.deletedAt) {
        throw new ConflictException(`Variety with ID ${id} is already deleted`);
      }

      throw new NotFoundException(`Variety with ID ${id} not found`);
    }

    const oldValue = this.toResponse(variety);
    await this.prisma.variety.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Variety soft deleted: ${id}`);

    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: id,
      operation: AuditOperation.SOFT_DELETE,
      oldValue: oldValue as unknown as Record<string, unknown>,
    });
  }

  async restore(id: string, userId?: string): Promise<VarietyResponseDto> {
    const variety = await this.prisma.variety.findUnique({
      where: { id },
    });

    if (!variety) {
      throw new NotFoundException(`Variety with ID ${id} not found`);
    }

    if (!variety.deletedAt) {
      throw new ConflictException(`Variety with ID ${id} is not deleted`);
    }

    const updated = await this.prisma.variety.update({
      where: { id },
      data: { deletedAt: null },
    });

    this.logger.log(`Variety restored: ${id}`);
    
    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: id,
      operation: AuditOperation.RESTORE,
      oldValue: { ...this.toResponse(variety), deletedAt: variety.deletedAt } as unknown as Record<string, unknown>,
      newValue: this.toResponse(updated) as unknown as Record<string, unknown>,
    });

    return this.toResponse(updated);
  }

  async purge(id: string, reason: string, userId?: string): Promise<void> {
    const variety = await this.prisma.variety.findUnique({ where: { id } });

    if (!variety) {
      throw new NotFoundException(`Variety with ID ${id} not found`);
    }

    if (!variety.deletedAt) {
      throw new ConflictException(`Variety with ID ${id} must be soft-deleted before purge`);
    }

    const linkedFieldLots = await this.prisma.fieldLot.count({ where: { varietyId: id } });
    if (linkedFieldLots > 0) {
      throw new ConflictException('Cannot purge variety because it is still referenced by field lots');
    }

    await this.prisma.variety.delete({ where: { id } });

    this.logger.log(`Variety purged: ${id}`);

    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: id,
      operation: AuditOperation.HARD_DELETE,
      oldValue: this.toResponse(variety) as unknown as Record<string, unknown>,
      newValue: { reason },
    });
  }

  private toResponse(variety: { id: string; code: string; name: string; description: string | null; productId: string; createdAt: Date; updatedAt: Date; deletedAt?: Date | null }) {
    return {
      id: variety.id,
      code: variety.code,
      name: variety.name,
      description: variety.description,
      productId: variety.productId,
      createdAt: variety.createdAt,
      updatedAt: variety.updatedAt,
      deletedAt: variety.deletedAt ?? null,
    };
  }
}
