import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFieldLotDto, UpdateFieldLotDto, FieldLotResponseDto, FieldLotWithDetailsResponseDto } from './dto';
import { getPaginationParams } from '../../common/dto/pagination.dto';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { AuditQueueService } from '../../common/events/audit-queue.service';
import { AuditOperation } from '../audit/dto/create-audit-log.dto';
import { Prisma } from '../../../generated/prisma/client';
import {
  getIsoCountryOptions,
  getItalianComuneOptions,
  getItalianProvinceOptions,
  getItalianRegionOptions,
  normalizeOriginInput,
  validateOriginInput,
} from './origin-reference';
import { ErrorCodes } from '../../common/errors/error-codes';

export const ENTITY_NAME = 'FieldLot';

@Injectable()
export class FieldLotsService {
  private readonly logger = new Logger(FieldLotsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditQueue: AuditQueueService,
  ) {}

  async create(dto: CreateFieldLotDto, userId?: string): Promise<FieldLotResponseDto> {
    const origin = normalizeOriginInput(dto);
    validateOriginInput(origin);

    const variety = await this.prisma.variety.findUnique({
      where: { id: dto.varietyId, deletedAt: null },
    });

    if (!variety) {
      throw new NotFoundException({
        code: ErrorCodes.VARIETY_NOT_FOUND,
        message: `Variety with ID ${dto.varietyId} not found`,
      });
    }

    const existing = await this.prisma.fieldLot.findUnique({
      where: { lotCode: dto.lotCode },
    });

    if (existing) {
      throw new ConflictException({
        code: ErrorCodes.FIELD_LOT_DUPLICATE_CODE,
        message: 'FieldLot with this lotCode already exists',
      });
    }

    const fieldLot = await this.prisma.fieldLot.create({
      data: {
        lotCode: dto.lotCode,
        supplier: dto.supplier,
        varietyId: dto.varietyId,
        originCountryCode: origin.originCountryCode,
        originRegion: origin.originRegion,
        originProvince: origin.originProvince,
        originComune: origin.originComune,
      },
    });

    this.logger.log(`FieldLot created: ${fieldLot.id}`);
    
    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: fieldLot.id,
      operation: AuditOperation.CREATE,
      newValue: dto as unknown as Record<string, unknown>,
    });

    return this.toResponse(fieldLot);
  }

  async findAll(
    dto: ListQueryDto,
  ): Promise<PaginatedResponse<FieldLotResponseDto>> {
    const { skip, take } = getPaginationParams(dto);
    const where: Prisma.FieldLotWhereInput = { deletedAt: null };

    if (dto.varietyId) {
      where.varietyId = dto.varietyId;
    }

    if (dto.productId) {
      where.variety = { productId: dto.productId };
    }

    if (dto.search) {
      where.OR = [
        { lotCode: { contains: dto.search } },
        { supplier: { contains: dto.search } },
      ];
    }

    const [fieldLots, total] = await this.prisma.$transaction([
      this.prisma.fieldLot.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { variety: true },
      }),
      this.prisma.fieldLot.count({ where }),
    ]);

    return {
      data: fieldLots.map((f) => this.toResponse(f)),
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
  ): Promise<PaginatedResponse<FieldLotResponseDto>> {
    const { skip, take } = getPaginationParams(dto);
    const where: Prisma.FieldLotWhereInput = { deletedAt: { not: null } };

    if (dto.varietyId) {
      where.varietyId = dto.varietyId;
    }

    if (dto.productId) {
      where.variety = { productId: dto.productId };
    }

    if (dto.search) {
      where.OR = [{ lotCode: { contains: dto.search } }, { supplier: { contains: dto.search } }];
    }

    const [fieldLots, total] = await this.prisma.$transaction([
      this.prisma.fieldLot.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.fieldLot.count({ where }),
    ]);

    return {
      data: fieldLots.map((f) => this.toResponse(f)),
      meta: {
        total,
        page: dto.page ?? 1,
        limit: dto.limit ?? 20,
        totalPages: Math.ceil(total / (dto.limit ?? 20)),
      },
    };
  }

  async findAllActive(): Promise<FieldLotResponseDto[]> {
    const fieldLots = await this.prisma.fieldLot.findMany({
      where: { deletedAt: null },
      orderBy: { lotCode: 'asc' },
    });

    return fieldLots.map((fieldLot) => this.toResponse(fieldLot));
  }

  async findById(id: string): Promise<FieldLotResponseDto> {
    const fieldLot = await this.prisma.fieldLot.findUnique({
      where: { id, deletedAt: null },
    });

    if (!fieldLot) {
      throw new NotFoundException({
        code: ErrorCodes.FIELD_LOT_NOT_FOUND,
        message: `FieldLot with ID ${id} not found`,
      });
    }

    return this.toResponse(fieldLot);
  }

  async findDeletedById(id: string): Promise<FieldLotResponseDto> {
    const fieldLot = await this.prisma.fieldLot.findUnique({
      where: { id, deletedAt: { not: null } },
    });

    if (!fieldLot) {
      throw new NotFoundException({
        code: ErrorCodes.FIELD_LOT_NOT_FOUND,
        message: `Soft-deleted field lot with ID ${id} not found`,
      });
    }

    return this.toResponse(fieldLot);
  }

  async findByIdWithDetails(id: string): Promise<FieldLotWithDetailsResponseDto> {
    const fieldLot = await this.prisma.fieldLot.findUnique({
      where: { id },
      include: { variety: true },
    });

    if (!fieldLot) {
      throw new NotFoundException({
        code: ErrorCodes.FIELD_LOT_NOT_FOUND,
        message: `FieldLot with ID ${id} not found`,
      });
    }

    return {
      id: fieldLot.id,
      lotCode: fieldLot.lotCode,
      supplier: fieldLot.supplier,
      varietyId: fieldLot.varietyId,
      originCountryCode: fieldLot.originCountryCode,
      originRegion: fieldLot.originRegion,
      originProvince: fieldLot.originProvince,
      originComune: fieldLot.originComune,
      createdAt: fieldLot.createdAt,
      updatedAt: fieldLot.updatedAt,
      deletedAt: fieldLot.deletedAt ?? null,
      variety: fieldLot.variety,
    };
  }

  async update(id: string, dto: UpdateFieldLotDto, userId?: string): Promise<FieldLotResponseDto> {
    const fieldLot = await this.prisma.fieldLot.findUnique({
      where: { id, deletedAt: null },
    });

    if (!fieldLot) {
      throw new NotFoundException({
        code: ErrorCodes.FIELD_LOT_NOT_FOUND,
        message: `FieldLot with ID ${id} not found`,
      });
    }

    if (dto.lotCode && dto.lotCode !== fieldLot.lotCode) {
      const existing = await this.prisma.fieldLot.findUnique({
        where: { lotCode: dto.lotCode },
      });
      if (existing) {
        throw new ConflictException({
          code: ErrorCodes.FIELD_LOT_DUPLICATE_CODE,
          message: 'FieldLot with this lotCode already exists',
        });
      }
    }

    const nextOrigin = normalizeOriginInput({
      originCountryCode: dto.originCountryCode ?? fieldLot.originCountryCode,
      originRegion: dto.originRegion === undefined ? fieldLot.originRegion : dto.originRegion,
      originProvince:
        dto.originProvince === undefined ? fieldLot.originProvince : dto.originProvince,
      originComune: dto.originComune === undefined ? fieldLot.originComune : dto.originComune,
    });
    validateOriginInput(nextOrigin);

    const shouldClearOriginHierarchy =
      dto.originCountryCode !== undefined &&
      nextOrigin.originCountryCode !== 'IT' &&
      dto.originRegion === undefined &&
      dto.originProvince === undefined &&
      dto.originComune === undefined;

    const oldValue = this.toResponse(fieldLot);
    const updated = await this.prisma.fieldLot.update({
      where: { id },
      data: {
        ...dto,
        originCountryCode: dto.originCountryCode
          ? nextOrigin.originCountryCode
          : undefined,
        originRegion: shouldClearOriginHierarchy
          ? null
          : dto.originRegion === undefined
            ? undefined
            : nextOrigin.originRegion ?? null,
        originProvince:
          shouldClearOriginHierarchy
            ? null
            : dto.originProvince === undefined
              ? undefined
              : nextOrigin.originProvince ?? null,
        originComune:
          shouldClearOriginHierarchy
            ? null
            : dto.originComune === undefined
              ? undefined
              : nextOrigin.originComune ?? null,
      },
    });

    this.logger.log(`FieldLot updated: ${id}`);
    
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
    const fieldLot = await this.prisma.fieldLot.findUnique({
      where: { id, deletedAt: null },
    });

    if (!fieldLot) {
      const deletedFieldLot = await this.prisma.fieldLot.findUnique({ where: { id } });
      if (deletedFieldLot?.deletedAt) {
        throw new ConflictException({
          code: ErrorCodes.CONFLICT,
          message: `FieldLot with ID ${id} is already deleted`,
        });
      }

      throw new NotFoundException({
        code: ErrorCodes.FIELD_LOT_NOT_FOUND,
        message: `FieldLot with ID ${id} not found`,
      });
    }

    const oldValue = this.toResponse(fieldLot);
    await this.prisma.fieldLot.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`FieldLot soft deleted: ${id}`);

    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: id,
      operation: AuditOperation.SOFT_DELETE,
      oldValue: oldValue as unknown as Record<string, unknown>,
    });
  }

  async restore(id: string, userId?: string): Promise<FieldLotResponseDto> {
    const fieldLot = await this.prisma.fieldLot.findUnique({
      where: { id },
    });

    if (!fieldLot) {
      throw new NotFoundException({
        code: ErrorCodes.FIELD_LOT_NOT_FOUND,
        message: `FieldLot with ID ${id} not found`,
      });
    }

    if (!fieldLot.deletedAt) {
      throw new ConflictException({
        code: ErrorCodes.CONFLICT,
        message: `FieldLot with ID ${id} is not deleted`,
      });
    }

    const updated = await this.prisma.fieldLot.update({
      where: { id },
      data: { deletedAt: null },
    });

    this.logger.log(`FieldLot restored: ${id}`);
    
    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: id,
      operation: AuditOperation.RESTORE,
      oldValue: { ...this.toResponse(fieldLot), deletedAt: fieldLot.deletedAt } as unknown as Record<string, unknown>,
      newValue: this.toResponse(updated) as unknown as Record<string, unknown>,
    });

    return this.toResponse(updated);
  }

  async purge(id: string, reason: string, userId?: string): Promise<void> {
    const fieldLot = await this.prisma.fieldLot.findUnique({ where: { id } });

    if (!fieldLot) {
      throw new NotFoundException({
        code: ErrorCodes.FIELD_LOT_NOT_FOUND,
        message: `FieldLot with ID ${id} not found`,
      });
    }

    if (!fieldLot.deletedAt) {
      throw new ConflictException({
        code: ErrorCodes.FIELD_LOT_PURGE_REQUIRES_SOFT_DELETE,
        message: `FieldLot with ID ${id} must be soft-deleted before purge`,
      });
    }

    const linkedPallets = await this.prisma.pallet.count({ where: { fieldLotId: id } });
    if (linkedPallets > 0) {
      throw new ConflictException({
        code: ErrorCodes.FIELD_LOT_PURGE_REFERENCED,
        message: 'Cannot purge field lot because it is still referenced by pallets',
      });
    }

    await this.prisma.fieldLot.delete({ where: { id } });

    this.logger.log(`FieldLot purged: ${id}`);

    this.auditQueue.push({
      userId,
      entity: ENTITY_NAME,
      entityId: id,
      operation: AuditOperation.HARD_DELETE,
      oldValue: this.toResponse(fieldLot) as unknown as Record<string, unknown>,
      newValue: { reason },
    });
  }

  getOriginCountries() {
    return getIsoCountryOptions();
  }

  getItalianRegions() {
    return getItalianRegionOptions();
  }

  getItalianProvinces(regionCode?: string) {
    return getItalianProvinceOptions(regionCode?.trim() || undefined);
  }

  getItalianComuni(params: { regionCode?: string; provinceCode?: string; search?: string }) {
    return getItalianComuneOptions({
      regionCode: params.regionCode?.trim() || undefined,
      provinceCode: params.provinceCode?.trim() || undefined,
      search: params.search,
    });
  }

  private toResponse(fieldLot: {
    id: string;
    lotCode: string;
    supplier: string;
    varietyId: string;
    originCountryCode: string;
    originRegion?: string | null;
    originProvince?: string | null;
    originComune?: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
  }) {
    return {
      id: fieldLot.id,
      lotCode: fieldLot.lotCode,
      supplier: fieldLot.supplier,
      varietyId: fieldLot.varietyId,
      originCountryCode: fieldLot.originCountryCode,
      originRegion: fieldLot.originRegion ?? null,
      originProvince: fieldLot.originProvince ?? null,
      originComune: fieldLot.originComune ?? null,
      createdAt: fieldLot.createdAt,
      updatedAt: fieldLot.updatedAt,
      deletedAt: fieldLot.deletedAt ?? null,
    };
  }
}
