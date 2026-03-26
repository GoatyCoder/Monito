import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductResponseDto, ProductWithVarietiesResponseDto } from './dto';
import { getPaginationParams } from '../../common/dto/pagination.dto';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { AuditQueueService } from '../../common/events/audit-queue.service';
import { AuditOperation } from '../audit/dto/create-audit-log.dto';
import { Prisma } from '../../../generated/prisma/client';

export const ENTITY_NAME = 'Product';
const PRODUCT_CODE_DB_MAX_LENGTH = 32;
const SOFT_DELETE_SUFFIX_PREFIX = '_del_';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditQueue: AuditQueueService,
  ) {}

  async create(dto: CreateProductDto, userId?: string): Promise<ProductResponseDto> {
    const existing = await this.prisma.product.findFirst({
      where: {
        code: dto.code,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException('Product with this code already exists');
    }

    const product = await this.prisma.product.create({
      data: dto,
    });

    this.logger.log(`Product created: ${product.id}`);
    
    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: product.id,
      operation: AuditOperation.CREATE,
      newValue: dto as unknown as Record<string, unknown>,
    });

    return this.toResponse(product);
  }

  async findAll(
    dto: ListQueryDto,
  ): Promise<PaginatedResponse<ProductResponseDto>> {
    const { skip, take } = getPaginationParams(dto);
    const where: Prisma.ProductWhereInput = { deletedAt: null };

    if (dto.search) {
      where.OR = [
        { code: { contains: dto.search } },
        { name: { contains: dto.search } },
      ];
    }

    const orderBy = this.parseSort(dto.sort);

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products.map((p) => this.toResponse(p)),
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
  ): Promise<PaginatedResponse<ProductResponseDto>> {
    const { skip, take } = getPaginationParams(dto);
    const where: Prisma.ProductWhereInput = { deletedAt: { not: null } };

    if (dto.search) {
      where.OR = [{ code: { contains: dto.search } }, { name: { contains: dto.search } }];
    }

    const orderBy = this.parseSort(dto.sort);

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products.map((p) => this.toResponse(p)),
      meta: {
        total,
        page: dto.page ?? 1,
        limit: dto.limit ?? 20,
        totalPages: Math.ceil(total / (dto.limit ?? 20)),
      },
    };
  }

  async findAllActive(): Promise<ProductResponseDto[]> {
    const products = await this.prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });

    return products.map((product) => this.toResponse(product));
  }

  private parseSort(sort?: string): Prisma.ProductOrderByWithRelationInput | undefined {
    if (!sort) return { createdAt: 'desc' };

    const parts = sort.split('_');
    if (parts.length !== 2) return { createdAt: 'desc' };

    const field = parts[0];
    const direction = parts[1] === 'desc' ? 'desc' : 'asc';

    const allowedFields: Record<string, Prisma.ProductOrderByWithRelationInput> = {
      code: { code: direction },
      name: { name: direction },
      createdAt: { createdAt: direction },
      updatedAt: { updatedAt: direction },
    };

    return allowedFields[field] || { createdAt: 'desc' };
  }

  async findById(id: string): Promise<ProductWithVarietiesResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id, deletedAt: null },
      include: { varieties: { where: { deletedAt: null } } },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.toResponseWithVarieties(product);
  }

  async findDeletedById(id: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id, deletedAt: { not: null } },
    });

    if (!product) {
      throw new NotFoundException(`Soft-deleted product with ID ${id} not found`);
    }

    return this.toResponse(product);
  }

  async update(id: string, dto: UpdateProductDto, userId?: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (dto.code && dto.code !== product.code) {
      const existing = await this.prisma.product.findFirst({
        where: {
          code: dto.code,
          deletedAt: null,
          NOT: { id },
        },
      });
      if (existing) {
        throw new ConflictException('Product with this code already exists');
      }
    }

    const oldValue = this.toResponse(product);
    const updated = await this.prisma.product.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`Product updated: ${id}`);
    
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
    const product = await this.prisma.product.findUnique({
      where: { id, deletedAt: null },
    });

    if (!product) {
      const deletedProduct = await this.prisma.product.findUnique({ where: { id } });
      if (deletedProduct?.deletedAt) {
        throw new ConflictException(`Product with ID ${id} is already deleted`);
      }

      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const oldValue = this.toResponse(product);
    const deletedCode = this.buildSoftDeletedCode(product.code);
    await this.prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        code: deletedCode,
      },
    });

    this.logger.log(`Product soft deleted: ${id}`);

    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: id,
      operation: AuditOperation.SOFT_DELETE,
      oldValue: oldValue as unknown as Record<string, unknown>,
    });
  }

  async restore(id: string, userId?: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (!product.deletedAt) {
      throw new ConflictException(`Product with ID ${id} is not deleted`);
    }

    const originalCode = this.extractOriginalCode(product.code);
    const activeWithOriginalCode = await this.prisma.product.findFirst({
      where: {
        code: originalCode,
        deletedAt: null,
        NOT: { id },
      },
    });

    if (activeWithOriginalCode) {
      throw new ConflictException(
        `Cannot restore product with ID ${id}: code ${originalCode} is already used by an active product`,
      );
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        deletedAt: null,
        code: originalCode,
      },
    });

    this.logger.log(`Product restored: ${id}`);
    
    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: id,
      operation: AuditOperation.RESTORE,
      oldValue: { ...this.toResponse(product), deletedAt: product.deletedAt } as unknown as Record<string, unknown>,
      newValue: this.toResponse(updated) as unknown as Record<string, unknown>,
    });

    return this.toResponse(updated);
  }

  async purge(id: string, reason: string, userId?: string): Promise<void> {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (!product.deletedAt) {
      throw new ConflictException(`Product with ID ${id} must be soft-deleted before purge`);
    }

    const linkedVarieties = await this.prisma.variety.count({ where: { productId: id } });
    if (linkedVarieties > 0) {
      throw new ConflictException('Cannot purge product because it is still referenced by varieties');
    }

    await this.prisma.product.delete({ where: { id } });

    this.logger.log(`Product purged: ${id}`);

    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: id,
      operation: AuditOperation.HARD_DELETE,
      oldValue: this.toResponse(product) as unknown as Record<string, unknown>,
      newValue: { reason },
    });
  }

  private toResponse(product: { id: string; code: string; name: string; description: string | null; createdAt: Date; updatedAt: Date; deletedAt?: Date | null }) {
    return {
      id: product.id,
      code: product.code,
      name: product.name,
      description: product.description,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      deletedAt: product.deletedAt ?? null,
    };
  }

  private toResponseWithVarieties(product: { id: string; code: string; name: string; description: string | null; createdAt: Date; updatedAt: Date; deletedAt?: Date | null; varieties: unknown[] }) {
    return {
      ...this.toResponse(product),
      varieties: product.varieties,
    };
  }

  private buildSoftDeletedCode(code: string): string {
    const suffix = `${SOFT_DELETE_SUFFIX_PREFIX}${Date.now()}`;
    const originalMaxLength = PRODUCT_CODE_DB_MAX_LENGTH - suffix.length;
    const safeCode = code.slice(0, originalMaxLength);
    return `${safeCode}${suffix}`;
  }

  private extractOriginalCode(code: string): string {
    const markerIndex = code.indexOf(SOFT_DELETE_SUFFIX_PREFIX);
    if (markerIndex < 0) {
      return code;
    }

    return code.slice(0, markerIndex);
  }
}
