import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductResponseDto, ProductWithVarietiesResponseDto } from './dto';
import { PaginationDto, getPaginationParams } from '../../common/dto/pagination.dto';
import { QueryFiltersDto } from '../../common/dto/query-filters.dto';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { AuditQueueService } from '../../common/events/audit-queue.service';
import { AuditOperation } from '../audit/dto/create-audit-log.dto';
import { Prisma } from '../../../generated/prisma/client';

export const ENTITY_NAME = 'Product';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditQueue: AuditQueueService,
  ) {}

  async create(dto: CreateProductDto, userId?: string): Promise<ProductResponseDto> {
    const existing = await this.prisma.product.findUnique({
      where: { code: dto.code },
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
    paginationDto: PaginationDto,
    filters: QueryFiltersDto,
  ): Promise<PaginatedResponse<ProductResponseDto>> {
    const { skip, take } = getPaginationParams(paginationDto);
    const where: Prisma.ProductWhereInput = {};

    if (!filters.includeDeleted) {
      where.deletedAt = null;
    }

    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search } },
        { name: { contains: filters.search } },
      ];
    }

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products.map((p) => this.toResponse(p)),
      meta: {
        total,
        page: paginationDto.page ?? 1,
        limit: paginationDto.limit ?? 20,
        totalPages: Math.ceil(total / (paginationDto.limit ?? 20)),
      },
    };
  }

  async findById(id: string, includeDeleted = false): Promise<ProductWithVarietiesResponseDto> {
    const where: Prisma.ProductWhereUniqueInput = { id };
    
    const product = await this.prisma.product.findUnique({
      where: includeDeleted ? where : { ...where, deletedAt: null },
      include: { varieties: !includeDeleted ? { where: { deletedAt: null } } : true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.toResponseWithVarieties(product);
  }

  async update(id: string, dto: UpdateProductDto, userId?: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (dto.code && dto.code !== product.code) {
      const existing = await this.prisma.product.findUnique({
        where: { code: dto.code },
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

  async delete(id: string, force = false, userId?: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (force) {
      await this.prisma.product.delete({
        where: { id },
      });

      this.logger.log(`Product hard deleted: ${id}`);
      
      this.auditQueue.push({
        userId,
        entity: ENTITY_NAME,
        entityId: id,
        operation: AuditOperation.HARD_DELETE,
        oldValue: this.toResponse(product) as unknown as Record<string, unknown>,
      });
    } else {
      const oldValue = this.toResponse(product);
      await this.prisma.product.update({
        where: { id },
        data: { deletedAt: new Date() },
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
  }

  async restore(id: string, userId?: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (!product.deletedAt) {
      throw new NotFoundException(`Product with ID ${id} is not deleted`);
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { deletedAt: null },
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
}
