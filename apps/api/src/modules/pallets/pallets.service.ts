import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePalletDto, UpdatePalletDto, PalletResponseDto, PalletWithDetailsResponseDto, PalletItemResponseDto } from './dto';
import { getPaginationParams } from '../../common/dto/pagination.dto';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { AuditQueueService } from '../../common/events/audit-queue.service';
import { AuditOperation } from '../audit/dto/create-audit-log.dto';
import { Prisma } from '../../../generated/prisma/client';

export const ENTITY_NAME = 'Pallet';

@Injectable()
export class PalletsService {
  private readonly logger = new Logger(PalletsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditQueue: AuditQueueService,
  ) {}

  async create(dto: CreatePalletDto, userId: string): Promise<PalletResponseDto> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Pallet must have at least one item');
    }

    const fieldLot = await this.prisma.fieldLot.findUnique({
      where: { id: dto.fieldLotId, deletedAt: null },
      include: {
        variety: {
          select: {
            id: true,
            productId: true,
            productSubtypeId: true,
          },
        },
      },
    });

    if (!fieldLot) {
      throw new NotFoundException(`Field lot with ID ${dto.fieldLotId} not found`);
    }

    const processedProductIds = [...new Set(dto.items.map((i) => i.processedProductId))];
    const packagingIds = [...new Set(dto.items.map((i) => i.packagingId))];

    const processedProducts = await this.prisma.processedProduct.findMany({
      where: { id: { in: processedProductIds }, deletedAt: null },
      include: {
        allowedProducts: true,
        allowedSubtypes: true,
        allowedVarieties: true,
      },
    });

    if (processedProducts.length !== processedProductIds.length) {
      throw new NotFoundException('One or more processed products not found');
    }

    const packagings = await this.prisma.packaging.findMany({
      where: { id: { in: packagingIds }, deletedAt: null },
    });

    if (packagings.length !== packagingIds.length) {
      throw new NotFoundException('One or more packagings not found');
    }

    for (const processedProduct of processedProducts) {
      if (
        !this.isProcessedProductAllowedForFieldLot(
          processedProduct,
          fieldLot.variety.productId,
          fieldLot.variety.productSubtypeId,
          fieldLot.variety.id,
        )
      ) {
        throw new BadRequestException(
          `Processed product ${processedProduct.code} is not allowed for the selected field lot variety`,
        );
      }
    }

    const palletNumber = await this.generatePalletNumber();

    const processedProductsMap = new Map<string, Prisma.ProcessedProductGetPayload<{}>>(processedProducts.map((pp) => [pp.id, pp]));
    
    const totalWeight = dto.items.reduce((sum, item) => {
      const pp = processedProductsMap.get(item.processedProductId);
      return sum + (pp?.weightPerBoxKg ?? 0) * item.quantity;
    }, 0);

    const pallet = await this.prisma.$transaction(async (tx) => {
      const created = await tx.pallet.create({
        data: {
          palletNumber,
          netWeightKg: dto.netWeightKg ?? totalWeight,
          fieldLotId: dto.fieldLotId,
          createdBy: dto.createdBy ?? userId,
          items: {
            create: dto.items.map((item) => {
              const pp = processedProductsMap.get(item.processedProductId)!;
              return {
                quantity: item.quantity,
                weightKg: pp.weightPerBoxKg * item.quantity,
                processedProductId: item.processedProductId,
                packagingId: item.packagingId,
              };
            }),
          },
        },
        include: {
          items: {
            include: {
              processedProduct: true,
              packaging: true,
            },
          },
        },
      });
      return created;
    });

    this.logger.log(`Pallet created: ${pallet.id} with number ${palletNumber}`);
    
    this.auditQueue.push({
      userId: userId,
      entity: ENTITY_NAME,
      entityId: pallet.id,
      operation: AuditOperation.CREATE,
      newValue: { palletNumber, netWeightKg: pallet.netWeightKg, fieldLotId: dto.fieldLotId, items: dto.items } as unknown as Record<string, unknown>,
    });

    return this.toResponseWithItems(pallet);
  }

  async findAll(
    dto: ListQueryDto,
  ): Promise<PaginatedResponse<PalletResponseDto>> {
    const { skip, take } = getPaginationParams(dto);
    const where: Prisma.PalletWhereInput = { deletedAt: null };

    if (dto.search) {
      where.palletNumber = { contains: dto.search };
    }

    if (dto.dateFrom || dto.dateTo) {
      where.createdAt = {};
      if (dto.dateFrom) {
        where.createdAt.gte = new Date(dto.dateFrom);
      }
      if (dto.dateTo) {
        where.createdAt.lte = new Date(dto.dateTo);
      }
    }

    if (dto.createdBy) {
      where.createdBy = dto.createdBy;
    }

    const [pallets, total] = await this.prisma.$transaction([
      this.prisma.pallet.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      }),
      this.prisma.pallet.count({ where }),
    ]);

    return {
      data: pallets.map((p) => this.toResponseWithItems(p)),
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
  ): Promise<PaginatedResponse<PalletResponseDto>> {
    const { skip, take } = getPaginationParams(dto);
    const where: Prisma.PalletWhereInput = {
      deletedAt: { not: null },
    };

    if (dto.search) {
      where.palletNumber = { contains: dto.search };
    }

    if (dto.dateFrom || dto.dateTo) {
      where.createdAt = {};
      if (dto.dateFrom) {
        where.createdAt.gte = new Date(dto.dateFrom);
      }
      if (dto.dateTo) {
        where.createdAt.lte = new Date(dto.dateTo);
      }
    }

    if (dto.createdBy) {
      where.createdBy = dto.createdBy;
    }

    const [pallets, total] = await this.prisma.$transaction([
      this.prisma.pallet.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      }),
      this.prisma.pallet.count({ where }),
    ]);

    return {
      data: pallets.map((p) => this.toResponseWithItems(p)),
      meta: {
        total,
        page: dto.page ?? 1,
        limit: dto.limit ?? 20,
        totalPages: Math.ceil(total / (dto.limit ?? 20)),
      },
    };
  }

  async findById(id: string): Promise<PalletWithDetailsResponseDto> {
    const pallet = await this.prisma.pallet.findUnique({
      where: { id, deletedAt: null },
      include: {
        fieldLot: {
          include: {
            variety: {
              include: {
                product: true,
              },
            },
          },
        },
        items: {
          include: {
            processedProduct: true,
            packaging: true,
          },
        },
      },
    });

    if (!pallet) {
      throw new NotFoundException(`Pallet with ID ${id} not found`);
    }

    return this.toResponseWithDetails(pallet);
  }

  async findDeletedById(id: string): Promise<PalletWithDetailsResponseDto> {
    const pallet = await this.prisma.pallet.findUnique({
      where: { id, deletedAt: { not: null } },
      include: {
        fieldLot: {
          include: {
            variety: {
              include: {
                product: true,
              },
            },
          },
        },
        items: {
          include: {
            processedProduct: true,
            packaging: true,
          },
        },
      },
    });

    if (!pallet) {
      throw new NotFoundException(`Soft-deleted pallet with ID ${id} not found`);
    }

    return this.toResponseWithDetails(pallet);
  }

  async findByPalletNumber(palletNumber: string): Promise<PalletWithDetailsResponseDto> {
    const pallet = await this.prisma.pallet.findUnique({
      where: { palletNumber, deletedAt: null },
      include: {
        fieldLot: {
          include: {
            variety: {
              include: {
                product: true,
              },
            },
          },
        },
        items: {
          include: {
            processedProduct: true,
            packaging: true,
          },
        },
      },
    });

    if (!pallet) {
      throw new NotFoundException(`Pallet with number ${palletNumber} not found`);
    }

    return this.toResponseWithDetails(pallet);
  }

  async update(id: string, dto: UpdatePalletDto, userId?: string): Promise<PalletResponseDto> {
    const pallet = await this.prisma.pallet.findUnique({
      where: { id, deletedAt: null },
      include: { items: true },
    });

    if (!pallet) {
      throw new NotFoundException(`Pallet with ID ${id} not found`);
    }

    const oldValue = this.toResponse(pallet);
    const updated = await this.prisma.pallet.update({
      where: { id },
      data: dto,
      include: { items: true },
    });

    this.logger.log(`Pallet updated: ${id}`);
    
    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: id,
      operation: AuditOperation.UPDATE,
      oldValue: oldValue as unknown as Record<string, unknown>,
      newValue: dto as unknown as Record<string, unknown>,
    });

    return this.toResponseWithItems(updated);
  }

  async delete(id: string, userId?: string): Promise<void> {
    const pallet = await this.prisma.pallet.findUnique({
      where: { id, deletedAt: null },
    });

    if (!pallet) {
      const deletedPallet = await this.prisma.pallet.findUnique({ where: { id } });
      if (deletedPallet?.deletedAt) {
        throw new ConflictException(`Pallet with ID ${id} is already deleted`);
      }

      throw new NotFoundException(`Pallet with ID ${id} not found`);
    }

    const oldValue = this.toResponse(pallet);
    await this.prisma.pallet.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Pallet soft deleted: ${id}`);

    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: id,
      operation: AuditOperation.SOFT_DELETE,
      oldValue: oldValue as unknown as Record<string, unknown>,
    });
  }

  async restore(id: string, userId?: string): Promise<PalletResponseDto> {
    const pallet = await this.prisma.pallet.findUnique({
      where: { id },
    });

    if (!pallet) {
      throw new NotFoundException(`Pallet with ID ${id} not found`);
    }

    if (!pallet.deletedAt) {
      throw new ConflictException(`Pallet with ID ${id} is not deleted`);
    }

    const updated = await this.prisma.pallet.update({
      where: { id },
      data: { deletedAt: null },
      include: { items: true },
    });

    this.logger.log(`Pallet restored: ${id}`);
    
    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: id,
      operation: AuditOperation.RESTORE,
      oldValue: { ...this.toResponse(pallet), deletedAt: pallet.deletedAt } as unknown as Record<string, unknown>,
      newValue: this.toResponseWithItems(updated) as unknown as Record<string, unknown>,
    });

    return this.toResponseWithItems(updated);
  }

  async purge(id: string, reason: string, userId?: string): Promise<void> {
    const pallet = await this.prisma.pallet.findUnique({ where: { id } });

    if (!pallet) {
      throw new NotFoundException(`Pallet with ID ${id} not found`);
    }

    if (!pallet.deletedAt) {
      throw new ConflictException(`Pallet with ID ${id} must be soft-deleted before purge`);
    }

    await this.prisma.pallet.delete({ where: { id } });

    this.logger.log(`Pallet purged: ${id}`);

    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: id,
      operation: AuditOperation.HARD_DELETE,
      oldValue: this.toResponse(pallet) as unknown as Record<string, unknown>,
      newValue: { reason },
    });
  }

  private async generatePalletNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const yearShort = String(year).slice(-2);
    const doy = this.getDayOfYear(today);
    const counterId = `${year}-${String(doy).padStart(3, '0')}`;

    const counter = await this.prisma.dailyPalletCounter.upsert({
      where: { id: counterId },
      update: {
        lastNumber: { increment: 1 },
      },
      create: {
        id: counterId,
        lastNumber: 1,
      },
    });

    return `P${yearShort}-${String(doy).padStart(3, '0')}-${counter.lastNumber}`;
  }

  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  private toResponse(pallet: { id: string; palletNumber: string; netWeightKg: number; fieldLotId: string; createdBy: string; createdAt: Date; updatedAt: Date; deletedAt?: Date | null }) {
    return {
      id: pallet.id,
      palletNumber: pallet.palletNumber,
      netWeightKg: pallet.netWeightKg,
      fieldLotId: pallet.fieldLotId,
      createdBy: pallet.createdBy,
      createdAt: pallet.createdAt,
      updatedAt: pallet.updatedAt,
      deletedAt: pallet.deletedAt ?? null,
    };
  }

  private toResponseWithItems(pallet: { id: string; palletNumber: string; netWeightKg: number; fieldLotId: string; createdBy: string; createdAt: Date; updatedAt: Date; deletedAt?: Date | null; items: { id: string; quantity: number; weightKg: number; processedProductId: string; packagingId: string; createdAt: Date }[] }) {
    return {
      ...this.toResponse(pallet),
      items: pallet.items.map((item) => this.toItemResponse(item)),
    };
  }

  private toResponseWithDetails(pallet: { id: string; palletNumber: string; netWeightKg: number; fieldLotId: string; createdBy: string; createdAt: Date; updatedAt: Date; deletedAt?: Date | null; fieldLot: unknown; items: (PalletItemResponseDto & { processedProduct: unknown; packaging: unknown })[] }) {
    return {
      ...this.toResponse(pallet),
      fieldLot: pallet.fieldLot,
      items: pallet.items.map((item) => ({
        ...this.toItemResponse(item),
        processedProduct: item.processedProduct,
        packaging: item.packaging,
      })),
    };
  }

  private toItemResponse(item: { id: string; quantity: number; weightKg: number; processedProductId: string; packagingId: string; createdAt: Date }) {
    return {
      id: item.id,
      quantity: item.quantity,
      weightKg: item.weightKg,
      processedProductId: item.processedProductId,
      packagingId: item.packagingId,
      createdAt: item.createdAt,
    };
  }

  private isProcessedProductAllowedForFieldLot(
    processedProduct: {
      allowedProducts?: { productId: string }[];
      allowedSubtypes?: { productSubtypeId: string }[];
      allowedVarieties?: { varietyId: string }[];
    },
    productId: string,
    productSubtypeId: string | null,
    varietyId: string,
  ): boolean {
    const allowedProducts = processedProduct.allowedProducts ?? [];
    const allowedSubtypes = processedProduct.allowedSubtypes ?? [];
    const allowedVarieties = processedProduct.allowedVarieties ?? [];

    if (allowedProducts.length === 0 && allowedSubtypes.length === 0 && allowedVarieties.length === 0) {
      return true;
    }

    if (allowedProducts.some((entry) => entry.productId === productId)) {
      return true;
    }

    if (
      productSubtypeId &&
      allowedSubtypes.some((entry) => entry.productSubtypeId === productSubtypeId)
    ) {
      return true;
    }

    if (allowedVarieties.some((entry) => entry.varietyId === varietyId)) {
      return true;
    }

    return false;
  }
}
