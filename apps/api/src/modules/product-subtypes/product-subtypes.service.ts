import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { ErrorCodes } from '../../common/errors/error-codes';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { getPaginationParams } from '../../common/dto/pagination.dto';
import { AuditQueueService } from '../../common/events/audit-queue.service';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditOperation } from '../audit/dto/create-audit-log.dto';
import {
  CreateProductSubtypeDto,
  ProductSubtypeResponseDto,
  UpdateProductSubtypeDto,
} from './dto';

export const ENTITY_NAME = 'ProductSubtype';
const CODE_DB_MAX_LENGTH = 32;
const CODE_SOFT_DELETE_SUFFIX_PREFIX = '_del_';

@Injectable()
export class ProductSubtypesService {
  private readonly logger = new Logger(ProductSubtypesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditQueue: AuditQueueService,
  ) {}

  async create(dto: CreateProductSubtypeDto, userId?: string): Promise<ProductSubtypeResponseDto> {
    await this.ensureProductExists(dto.productId);

    await this.ensureSubtypeCodeAvailable(dto.productId, dto.code);

    const subtype = await this.prisma.productSubtype.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        productId: dto.productId,
      },
    });

    this.logger.log(`ProductSubtype created: ${subtype.id}`);

    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: subtype.id,
      operation: AuditOperation.CREATE,
      newValue: dto as unknown as Record<string, unknown>,
    });

    return this.toResponse(subtype);
  }

  async findAll(dto: ListQueryDto): Promise<PaginatedResponse<ProductSubtypeResponseDto>> {
    const { skip, take } = getPaginationParams(dto);
    const where: Prisma.ProductSubtypeWhereInput = { deletedAt: null };

    if (dto.productId) {
      where.productId = dto.productId;
    }

    if (dto.search) {
      where.OR = [{ code: { contains: dto.search } }, { name: { contains: dto.search } }];
    }

    const [subtypes, total] = await this.prisma.$transaction([
      this.prisma.productSubtype.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.productSubtype.count({ where }),
    ]);

    return {
      data: subtypes.map((subtype) => this.toResponse(subtype)),
      meta: {
        total,
        page: dto.page ?? 1,
        limit: dto.limit ?? 20,
        totalPages: Math.ceil(total / (dto.limit ?? 20)),
      },
    };
  }

  async findDeleted(dto: ListQueryDto): Promise<PaginatedResponse<ProductSubtypeResponseDto>> {
    const { skip, take } = getPaginationParams(dto);
    const where: Prisma.ProductSubtypeWhereInput = { deletedAt: { not: null } };

    if (dto.productId) {
      where.productId = dto.productId;
    }

    if (dto.search) {
      where.OR = [{ code: { contains: dto.search } }, { name: { contains: dto.search } }];
    }

    const [subtypes, total] = await this.prisma.$transaction([
      this.prisma.productSubtype.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.productSubtype.count({ where }),
    ]);

    return {
      data: subtypes.map((subtype) => this.toResponse(subtype)),
      meta: {
        total,
        page: dto.page ?? 1,
        limit: dto.limit ?? 20,
        totalPages: Math.ceil(total / (dto.limit ?? 20)),
      },
    };
  }

  async findAllActive(): Promise<ProductSubtypeResponseDto[]> {
    const subtypes = await this.prisma.productSubtype.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });

    return subtypes.map((subtype) => this.toResponse(subtype));
  }

  async findById(id: string): Promise<ProductSubtypeResponseDto> {
    const subtype = await this.prisma.productSubtype.findUnique({
      where: { id, deletedAt: null },
    });

    if (!subtype) {
      throw new NotFoundException({
        code: ErrorCodes.PRODUCT_SUBTYPE_NOT_FOUND,
        message: `Product subtype with ID ${id} not found`,
      });
    }

    return this.toResponse(subtype);
  }

  async findDeletedById(id: string): Promise<ProductSubtypeResponseDto> {
    const subtype = await this.prisma.productSubtype.findUnique({
      where: { id, deletedAt: { not: null } },
    });

    if (!subtype) {
      throw new NotFoundException({
        code: ErrorCodes.PRODUCT_SUBTYPE_NOT_FOUND,
        message: `Soft-deleted product subtype with ID ${id} not found`,
      });
    }

    return this.toResponse(subtype);
  }

  async findByProductId(productId: string): Promise<ProductSubtypeResponseDto[]> {
    await this.ensureProductExists(productId);

    const subtypes = await this.prisma.productSubtype.findMany({
      where: { productId, deletedAt: null },
      orderBy: { name: 'asc' },
    });

    return subtypes.map((subtype) => this.toResponse(subtype));
  }

  async update(id: string, dto: UpdateProductSubtypeDto, userId?: string): Promise<ProductSubtypeResponseDto> {
    const subtype = await this.prisma.productSubtype.findUnique({
      where: { id, deletedAt: null },
    });

    if (!subtype) {
      throw new NotFoundException({
        code: ErrorCodes.PRODUCT_SUBTYPE_NOT_FOUND,
        message: `Product subtype with ID ${id} not found`,
      });
    }

    if (dto.code && dto.code !== subtype.code) {
      await this.ensureSubtypeCodeAvailable(subtype.productId, dto.code, id);
    }

    const oldValue = this.toResponse(subtype);
    const updated = await this.prisma.productSubtype.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`ProductSubtype updated: ${id}`);

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
    const subtype = await this.prisma.productSubtype.findUnique({
      where: { id, deletedAt: null },
    });

    if (!subtype) {
      const deletedSubtype = await this.prisma.productSubtype.findUnique({ where: { id } });
      if (deletedSubtype?.deletedAt) {
        throw new ConflictException({
          code: ErrorCodes.CONFLICT,
          message: `Product subtype with ID ${id} is already deleted`,
        });
      }

      throw new NotFoundException({
        code: ErrorCodes.PRODUCT_SUBTYPE_NOT_FOUND,
        message: `Product subtype with ID ${id} not found`,
      });
    }

    const oldValue = this.toResponse(subtype);
    const deletedCode = this.buildSoftDeletedCode(subtype.code);
    await this.prisma.productSubtype.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        code: deletedCode,
      },
    });

    this.logger.log(`ProductSubtype soft deleted: ${id}`);

    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: id,
      operation: AuditOperation.SOFT_DELETE,
      oldValue: oldValue as unknown as Record<string, unknown>,
    });
  }

  async restore(id: string, userId?: string): Promise<ProductSubtypeResponseDto> {
    const subtype = await this.prisma.productSubtype.findUnique({ where: { id } });

    if (!subtype) {
      throw new NotFoundException({
        code: ErrorCodes.PRODUCT_SUBTYPE_NOT_FOUND,
        message: `Product subtype with ID ${id} not found`,
      });
    }

    if (!subtype.deletedAt) {
      throw new ConflictException({
        code: ErrorCodes.CONFLICT,
        message: `Product subtype with ID ${id} is not deleted`,
      });
    }

    const originalCode = this.extractOriginalCode(subtype.code);
    await this.ensureSubtypeCodeAvailable(subtype.productId, originalCode, id);

    const updated = await this.prisma.productSubtype.update({
      where: { id },
      data: {
        deletedAt: null,
        code: originalCode,
      },
    });

    this.logger.log(`ProductSubtype restored: ${id}`);

    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: id,
      operation: AuditOperation.RESTORE,
      oldValue: { ...this.toResponse(subtype), deletedAt: subtype.deletedAt } as unknown as Record<string, unknown>,
      newValue: this.toResponse(updated) as unknown as Record<string, unknown>,
    });

    return this.toResponse(updated);
  }

  async purge(id: string, reason: string, userId?: string): Promise<void> {
    const subtype = await this.prisma.productSubtype.findUnique({ where: { id } });

    if (!subtype) {
      throw new NotFoundException({
        code: ErrorCodes.PRODUCT_SUBTYPE_NOT_FOUND,
        message: `Product subtype with ID ${id} not found`,
      });
    }

    if (!subtype.deletedAt) {
      throw new ConflictException({
        code: ErrorCodes.CONFLICT,
        message: `Product subtype with ID ${id} must be soft-deleted before purge`,
      });
    }

    const linkedVarieties = await this.prisma.variety.count({
      where: {
        productSubtypeId: id,
        deletedAt: null,
      },
    });

    if (linkedVarieties > 0) {
      throw new ConflictException({
        code: ErrorCodes.CONFLICT,
        message: 'Cannot purge product subtype because it is still referenced by active varieties',
      });
    }

    await this.prisma.productSubtype.delete({ where: { id } });

    this.logger.log(`ProductSubtype purged: ${id}`);

    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: id,
      operation: AuditOperation.HARD_DELETE,
      oldValue: this.toResponse(subtype) as unknown as Record<string, unknown>,
      newValue: { reason },
    });
  }

  private async ensureProductExists(productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: {
        id: productId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new NotFoundException({
        code: ErrorCodes.PRODUCT_NOT_FOUND,
        message: `Product with ID ${productId} not found`,
      });
    }
  }

  private async ensureSubtypeCodeAvailable(productId: string, code: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.productSubtype.findFirst({
      where: {
        productId,
        code,
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });

    if (existing) {
      throw new ConflictException({
        code: ErrorCodes.PRODUCT_SUBTYPE_ALREADY_EXISTS,
        message: 'Product subtype with this code already exists for the selected product',
      });
    }
  }

  private toResponse(subtype: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    productId: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
  }): ProductSubtypeResponseDto {
    return {
      id: subtype.id,
      code: subtype.code,
      name: subtype.name,
      description: subtype.description,
      productId: subtype.productId,
      createdAt: subtype.createdAt,
      updatedAt: subtype.updatedAt,
      deletedAt: subtype.deletedAt ?? null,
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
