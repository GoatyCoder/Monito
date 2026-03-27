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
const CODE_DB_MAX_LENGTH = 32;
const CODE_SOFT_DELETE_SUFFIX_PREFIX = '_del_';

@Injectable()
export class ProcessedProductsService {
  private readonly logger = new Logger(ProcessedProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditQueue: AuditQueueService,
  ) {}

  async create(dto: CreateProcessedProductDto, userId?: string): Promise<ProcessedProductResponseDto> {
    const constraints = this.extractConstraintIds(dto);
    const existing = await this.prisma.processedProduct.findFirst({
      where: {
        code: dto.code,
        deletedAt: null,
      },
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

    await this.ensureConstraintReferencesExist(constraints);

    const product = await this.prisma.processedProduct.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        ean: dto.ean,
        weightPerBoxKg: dto.weightPerBoxKg,
        allowedProducts:
          constraints.allowedProductIds.length > 0
            ? {
                create: constraints.allowedProductIds.map((productId) => ({ productId })),
              }
            : undefined,
        allowedSubtypes:
          constraints.allowedSubtypeIds.length > 0
            ? {
                create: constraints.allowedSubtypeIds.map((productSubtypeId) => ({ productSubtypeId })),
              }
            : undefined,
        allowedVarieties:
          constraints.allowedVarietyIds.length > 0
            ? {
                create: constraints.allowedVarietyIds.map((varietyId) => ({ varietyId })),
              }
            : undefined,
      },
      include: {
        allowedProducts: true,
        allowedSubtypes: true,
        allowedVarieties: true,
      },
    });

    this.logger.log(`ProcessedProduct created: ${product.id}`);
    
    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: product.id,
      operation: AuditOperation.CREATE,
      newValue: {
        ...dto,
        ...constraints,
      } as unknown as Record<string, unknown>,
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
        include: {
          allowedProducts: true,
          allowedSubtypes: true,
          allowedVarieties: true,
        },
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

  async findAllActive(): Promise<ProcessedProductResponseDto[]> {
    const products = await this.prisma.processedProduct.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      include: {
        allowedProducts: true,
        allowedSubtypes: true,
        allowedVarieties: true,
      },
    });

    return products.map((product) => this.toResponse(product));
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
        include: {
          allowedProducts: true,
          allowedSubtypes: true,
          allowedVarieties: true,
        },
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
      include: {
        allowedProducts: true,
        allowedSubtypes: true,
        allowedVarieties: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Processed product with ID ${id} not found`);
    }

    return this.toResponse(product);
  }

  async findDeletedById(id: string): Promise<ProcessedProductResponseDto> {
    const product = await this.prisma.processedProduct.findUnique({
      where: { id, deletedAt: { not: null } },
      include: {
        allowedProducts: true,
        allowedSubtypes: true,
        allowedVarieties: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Soft-deleted processed product with ID ${id} not found`);
    }

    return this.toResponse(product);
  }

  async update(id: string, dto: UpdateProcessedProductDto, userId?: string): Promise<ProcessedProductResponseDto> {
    const constraints = this.extractConstraintIds(dto);
    const product = await this.prisma.processedProduct.findUnique({
      where: { id, deletedAt: null },
      include: {
        allowedProducts: true,
        allowedSubtypes: true,
        allowedVarieties: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Processed product with ID ${id} not found`);
    }

    if (dto.code && dto.code !== product.code) {
      const existing = await this.prisma.processedProduct.findFirst({
        where: {
          code: dto.code,
          deletedAt: null,
          NOT: { id },
        },
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

    await this.ensureConstraintReferencesExist(constraints);

    const oldValue = this.toResponse(product);
    const updated = await this.prisma.processedProduct.update({
      where: { id },
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        ean: dto.ean,
        weightPerBoxKg: dto.weightPerBoxKg,
        ...(dto.allowedProductIds
          ? {
              allowedProducts: {
                deleteMany: {},
                create: constraints.allowedProductIds.map((productId) => ({ productId })),
              },
            }
          : {}),
        ...(dto.allowedSubtypeIds
          ? {
              allowedSubtypes: {
                deleteMany: {},
                create: constraints.allowedSubtypeIds.map((productSubtypeId) => ({ productSubtypeId })),
              },
            }
          : {}),
        ...(dto.allowedVarietyIds
          ? {
              allowedVarieties: {
                deleteMany: {},
                create: constraints.allowedVarietyIds.map((varietyId) => ({ varietyId })),
              },
            }
          : {}),
      },
      include: {
        allowedProducts: true,
        allowedSubtypes: true,
        allowedVarieties: true,
      },
    });

    this.logger.log(`ProcessedProduct updated: ${id}`);
    
    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: id,
      operation: AuditOperation.UPDATE,
      oldValue: oldValue as unknown as Record<string, unknown>,
      newValue: {
        ...dto,
        ...constraints,
      } as unknown as Record<string, unknown>,
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
    const deletedCode = this.buildSoftDeletedCode(product.code);
    await this.prisma.processedProduct.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        code: deletedCode,
      },
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
      include: {
        allowedProducts: true,
        allowedSubtypes: true,
        allowedVarieties: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Processed product with ID ${id} not found`);
    }

    if (!product.deletedAt) {
      throw new ConflictException(`Processed product with ID ${id} is not deleted`);
    }

    const originalCode = this.extractOriginalCode(product.code);
    const activeWithOriginalCode = await this.prisma.processedProduct.findFirst({
      where: {
        code: originalCode,
        deletedAt: null,
        NOT: { id },
      },
    });

    if (activeWithOriginalCode) {
      throw new ConflictException(
        `Cannot restore processed product with ID ${id}: code ${originalCode} is already used by an active processed product`,
      );
    }

    const updated = await this.prisma.processedProduct.update({
      where: { id },
      data: {
        deletedAt: null,
        code: originalCode,
      },
      include: {
        allowedProducts: true,
        allowedSubtypes: true,
        allowedVarieties: true,
      },
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

  private toResponse(product: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    ean: string | null;
    weightPerBoxKg: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
    allowedProducts?: { productId: string }[];
    allowedSubtypes?: { productSubtypeId: string }[];
    allowedVarieties?: { varietyId: string }[];
  }): ProcessedProductResponseDto {
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
      allowedProductIds: product.allowedProducts?.map((item) => item.productId) ?? [],
      allowedSubtypeIds: product.allowedSubtypes?.map((item) => item.productSubtypeId) ?? [],
      allowedVarietyIds: product.allowedVarieties?.map((item) => item.varietyId) ?? [],
    };
  }

  private extractConstraintIds(dto: {
    allowedProductIds?: string[];
    allowedSubtypeIds?: string[];
    allowedVarietyIds?: string[];
  }): {
    allowedProductIds: string[];
    allowedSubtypeIds: string[];
    allowedVarietyIds: string[];
  } {
    return {
      allowedProductIds: [...new Set(dto.allowedProductIds ?? [])],
      allowedSubtypeIds: [...new Set(dto.allowedSubtypeIds ?? [])],
      allowedVarietyIds: [...new Set(dto.allowedVarietyIds ?? [])],
    };
  }

  private async ensureConstraintReferencesExist(constraints: {
    allowedProductIds: string[];
    allowedSubtypeIds: string[];
    allowedVarietyIds: string[];
  }): Promise<void> {
    const productsCount =
      constraints.allowedProductIds.length > 0
        ? await this.prisma.product.count({
            where: {
              id: { in: constraints.allowedProductIds },
              deletedAt: null,
            },
          })
        : 0;

    const subtypesCount =
      constraints.allowedSubtypeIds.length > 0
        ? await this.prisma.productSubtype.count({
            where: {
              id: { in: constraints.allowedSubtypeIds },
              deletedAt: null,
            },
          })
        : 0;

    const varietiesCount =
      constraints.allowedVarietyIds.length > 0
        ? await this.prisma.variety.count({
            where: {
              id: { in: constraints.allowedVarietyIds },
              deletedAt: null,
            },
          })
        : 0;

    if (constraints.allowedProductIds.length > 0 && productsCount !== constraints.allowedProductIds.length) {
      throw new NotFoundException('One or more allowed products not found');
    }

    if (constraints.allowedSubtypeIds.length > 0 && subtypesCount !== constraints.allowedSubtypeIds.length) {
      throw new NotFoundException('One or more allowed product subtypes not found');
    }

    if (constraints.allowedVarietyIds.length > 0 && varietiesCount !== constraints.allowedVarietyIds.length) {
      throw new NotFoundException('One or more allowed varieties not found');
    }
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
