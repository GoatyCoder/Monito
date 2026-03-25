import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProcessedProductDto, UpdateProcessedProductDto, ProcessedProductResponseDto } from './dto';
import { PaginationDto, getPaginationParams } from '../../common/dto/pagination.dto';
import { QueryFiltersDto } from '../../common/dto/query-filters.dto';
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
    paginationDto: PaginationDto,
    filters: QueryFiltersDto,
  ): Promise<PaginatedResponse<ProcessedProductResponseDto>> {
    const { skip, take } = getPaginationParams(paginationDto);
    const where: Prisma.ProcessedProductWhereInput = {};

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
        page: paginationDto.page ?? 1,
        limit: paginationDto.limit ?? 20,
        totalPages: Math.ceil(total / (paginationDto.limit ?? 20)),
      },
    };
  }

  async findOne(id: string, includeDeleted = false): Promise<ProcessedProductResponseDto> {
    const where: Prisma.ProcessedProductWhereUniqueInput = { id };
    const product = await this.prisma.processedProduct.findUnique({
      where: includeDeleted ? where : { ...where, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(`Processed product with ID ${id} not found`);
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

  async remove(id: string, force = false, userId?: string): Promise<void> {
    const product = await this.prisma.processedProduct.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Processed product with ID ${id} not found`);
    }

    if (force) {
      await this.prisma.processedProduct.delete({
        where: { id },
      });

      this.logger.log(`ProcessedProduct hard deleted: ${id}`);
      
      this.auditQueue.push({
        userId,
        entity: ENTITY_NAME,
        entityId: id,
        operation: AuditOperation.HARD_DELETE,
        oldValue: this.toResponse(product) as unknown as Record<string, unknown>,
      });
    } else {
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
  }

  async restore(id: string, userId?: string): Promise<ProcessedProductResponseDto> {
    const product = await this.prisma.processedProduct.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Processed product with ID ${id} not found`);
    }

    if (!product.deletedAt) {
      throw new NotFoundException(`Processed product with ID ${id} is not deleted`);
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