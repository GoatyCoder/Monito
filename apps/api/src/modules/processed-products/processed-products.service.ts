import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProcessedProductDto, UpdateProcessedProductDto, ProcessedProductResponseDto } from './dto';
import { getPaginationParams } from '../../common/dto/pagination.dto';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { AuditQueueService } from '../../common/events/audit-queue.service';
import { AuditOperation } from '../audit/dto/create-audit-log.dto';
import { Prisma } from '../../../generated/prisma/client';

export const ENTITY_NAME = 'ProcessedProduct';

@Injectable()
export class ProcessedProductsService {
  private readonly logger = new Logger(ProcessedProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditQueue: AuditQueueService,
  ) {}

  async create(dto: CreateProcessedProductDto, userId?: string): Promise<ProcessedProductResponseDto> {
    const existing = await this.prisma.processedProduct.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('ProcessedProduct with this code already exists');
    }

    if (dto.ean) {
      const existingEan = await this.prisma.processedProduct.findUnique({
        where: { ean: dto.ean },
      });
      if (existingEan) {
        throw new ConflictException('Processed product with this EAN already exists');
      }
    }

    const product = await this.prisma.processedProduct.create({
      data: dto,
    });

    this.logger.log(`ProcessedProduct created: ${product.id}`);
    
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
  ): Promise<PaginatedResponse<ProcessedProductResponseDto>> {
    const { skip, take } = getPaginationParams(dto);
    const where: Prisma.ProcessedProductWhereInput = { deletedAt: null };

    if (dto.search) {
      where.OR = [
        { code: { contains: dto.search } },
        { name: { contains: dto.search } },
      ];
    }

    const [products, total] = await this.prisma.$transaction([
      this.prisma.processedProduct.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.processedProduct.count({ where }),
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
  ): Promise<PaginatedResponse<ProcessedProductResponseDto>> {
    const { skip, take } = getPaginationParams(dto);
    const where: Prisma.ProcessedProductWhereInput = { deletedAt: { not: null } };

    if (dto.search) {
      where.OR = [{ code: { contains: dto.search } }, { name: { contains: dto.search } }];
    }

    const [products, total] = await this.prisma.$transaction([
      this.prisma.processedProduct.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.processedProduct.count({ where }),
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

  async findById(id: string): Promise<ProcessedProductResponseDto> {
    const product = await this.prisma.processedProduct.findUnique({
      where: { id, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(`Processed product with ID ${id} not found`);
    }

    return this.toResponse(product);
  }

  async findDeletedById(id: string): Promise<ProcessedProductResponseDto> {
    const product = await this.prisma.processedProduct.findUnique({
      where: { id, deletedAt: { not: null } },
    });

    if (!product) {
      throw new NotFoundException(`Soft-deleted processed product with ID ${id} not found`);
    }

    return this.toResponse(product);
  }

  async update(id: string, dto: UpdateProcessedProductDto, userId?: string): Promise<ProcessedProductResponseDto> {
    const product = await this.prisma.processedProduct.findUnique({
      where: { id, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(`Processed product with ID ${id} not found`);
    }

    if (dto.code && dto.code !== product.code) {
      const existing = await this.prisma.processedProduct.findUnique({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException('ProcessedProduct with this code already exists');
      }
    }

    if (dto.ean && dto.ean !== product.ean) {
      const existingEan = await this.prisma.processedProduct.findUnique({
        where: { ean: dto.ean },
      });
      if (existingEan) {
        throw new ConflictException('Processed product with this EAN already exists');
      }
    }

    const oldValue = this.toResponse(product);
    const updated = await this.prisma.processedProduct.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`ProcessedProduct updated: ${id}`);
    
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
    const product = await this.prisma.processedProduct.findUnique({
      where: { id, deletedAt: null },
    });

    if (!product) {
      const deletedProduct = await this.prisma.processedProduct.findUnique({ where: { id } });
      if (deletedProduct?.deletedAt) {
        throw new ConflictException(`Processed product with ID ${id} is already deleted`);
      }

      throw new NotFoundException(`Processed product with ID ${id} not found`);
    }

    const oldValue = this.toResponse(product);
    await this.prisma.processedProduct.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`ProcessedProduct soft deleted: ${id}`);

    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: id,
      operation: AuditOperation.SOFT_DELETE,
      oldValue: oldValue as unknown as Record<string, unknown>,
    });
  }

  async restore(id: string, userId?: string): Promise<ProcessedProductResponseDto> {
    const product = await this.prisma.processedProduct.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Processed product with ID ${id} not found`);
    }

    if (!product.deletedAt) {
      throw new ConflictException(`Processed product with ID ${id} is not deleted`);
    }

    const updated = await this.prisma.processedProduct.update({
      where: { id },
      data: { deletedAt: null },
    });

    this.logger.log(`ProcessedProduct restored: ${id}`);
    
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
    const product = await this.prisma.processedProduct.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Processed product with ID ${id} not found`);
    }

    if (!product.deletedAt) {
      throw new ConflictException(`Processed product with ID ${id} must be soft-deleted before purge`);
    }

    const linkedPalletItems = await this.prisma.palletItem.count({ where: { processedProductId: id } });
    if (linkedPalletItems > 0) {
      throw new ConflictException(
        'Cannot purge processed product because it is still referenced by pallet items',
      );
    }

    await this.prisma.processedProduct.delete({ where: { id } });

    this.logger.log(`ProcessedProduct purged: ${id}`);

    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: id,
      operation: AuditOperation.HARD_DELETE,
      oldValue: this.toResponse(product) as unknown as Record<string, unknown>,
      newValue: { reason },
    });
  }

  private toResponse(product: { id: string; code: string; name: string; description: string | null; ean: string | null; weightPerBoxKg: number; createdAt: Date; updatedAt: Date; deletedAt?: Date | null }): ProcessedProductResponseDto {
    return {
      id: product.id,
      code: product.code,
      name: product.name,
      description: product.description,
      ean: product.ean,
      weightPerBoxKg: product.weightPerBoxKg,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      deletedAt: product.deletedAt ?? null,
    };
  }
}
