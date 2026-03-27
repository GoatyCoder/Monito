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
const CODE_DB_MAX_LENGTH = 32;
const CODE_SOFT_DELETE_SUFFIX_PREFIX = '_del_';

@Injectable()
export class VarietiesService {
  private readonly logger = new Logger(VarietiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditQueue: AuditQueueService,
  ) {}

  async create(dto: CreateVarietyDto, userId?: string): Promise<VarietyResponseDto> {
    await this.ensureProductExists(dto.productId);
    await this.ensureVarietyCodeAvailable(dto.productId, dto.code);
    const productSubtypeId = await this.validateSubtypeBelongsToProduct(
      dto.productId,
      dto.productSubtypeId,
    );

    const variety = await this.prisma.variety.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        productId: dto.productId,
        productSubtypeId,
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

  async findAllActive(): Promise<VarietyResponseDto[]> {
    const varieties = await this.prisma.variety.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });

    return varieties.map((variety) => this.toResponse(variety));
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

    const nextProductId = dto.productId ?? variety.productId;
    const isProductChanged = nextProductId !== variety.productId;

    if (isProductChanged) {
      await this.ensureProductExists(nextProductId);
    }

    const nextCode = dto.code ?? variety.code;
    if (nextCode !== variety.code || isProductChanged) {
      await this.ensureVarietyCodeAvailable(nextProductId, nextCode, id);
    }

    const subtypeInput =
      dto.productSubtypeId === undefined && isProductChanged ? null : dto.productSubtypeId;

    const productSubtypeId = await this.validateSubtypeBelongsToProduct(
      nextProductId,
      subtypeInput,
    );

    const oldValue = this.toResponse(variety);
    const updated = await this.prisma.variety.update({
      where: { id },
      data: {
        ...dto,
        productId: isProductChanged ? nextProductId : undefined,
        productSubtypeId: subtypeInput === undefined ? undefined : productSubtypeId,
      },
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
    const deletedCode = this.buildSoftDeletedCode(variety.code);
    await this.prisma.variety.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        code: deletedCode,
      },
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

    const originalCode = this.extractOriginalCode(variety.code);
    await this.ensureVarietyCodeAvailable(variety.productId, originalCode, id);

    const updated = await this.prisma.variety.update({
      where: { id },
      data: {
        deletedAt: null,
        code: originalCode,
      },
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

  private toResponse(variety: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    productId: string;
    productSubtypeId?: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
  }) {
    return {
      id: variety.id,
      code: variety.code,
      name: variety.name,
      description: variety.description,
      productId: variety.productId,
      productSubtypeId: variety.productSubtypeId ?? null,
      createdAt: variety.createdAt,
      updatedAt: variety.updatedAt,
      deletedAt: variety.deletedAt ?? null,
    };
  }

  private async ensureProductExists(productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: {
        id: productId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }
  }

  private async ensureVarietyCodeAvailable(productId: string, code: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.variety.findFirst({
      where: {
        productId,
        code,
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });

    if (existing) {
      throw new ConflictException('Variety with this code already exists for the selected product');
    }
  }

  private async validateSubtypeBelongsToProduct(
    productId: string,
    productSubtypeId?: string | null,
  ): Promise<string | null | undefined> {
    if (productSubtypeId === undefined) {
      return undefined;
    }

    if (productSubtypeId === null) {
      return null;
    }

    const subtype = await this.prisma.productSubtype.findUnique({
      where: {
        id: productSubtypeId,
        deletedAt: null,
      },
    });

    if (!subtype) {
      throw new NotFoundException(`Product subtype with ID ${productSubtypeId} not found`);
    }

    if (subtype.productId !== productId) {
      throw new ConflictException('Product subtype does not belong to the selected product');
    }

    return subtype.id;
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
