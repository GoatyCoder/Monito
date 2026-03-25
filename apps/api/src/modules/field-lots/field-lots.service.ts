import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFieldLotDto, UpdateFieldLotDto, FieldLotResponseDto, FieldLotWithDetailsResponseDto } from './dto';
import { PaginationDto, getPaginationParams } from '../../common/dto/pagination.dto';
import { QueryFiltersDto } from '../../common/dto/query-filters.dto';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { AuditQueueService } from '../../common/events/audit-queue.service';
import { AuditOperation } from '../audit/dto/create-audit-log.dto';
import { Prisma } from '../../../generated/prisma/client';

export const ENTITY_NAME = 'FieldLot';

@Injectable()
export class FieldLotsService {
  private readonly logger = new Logger(FieldLotsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditQueue: AuditQueueService,
  ) {}

  async create(dto: CreateFieldLotDto, userId?: string): Promise<FieldLotResponseDto> {
    const variety = await this.prisma.variety.findUnique({
      where: { id: dto.varietyId },
    });

    if (!variety) {
      throw new NotFoundException(`Variety with ID ${dto.varietyId} not found`);
    }

    const existing = await this.prisma.fieldLot.findUnique({
      where: { lotCode: dto.lotCode },
    });

    if (existing) {
      throw new ConflictException('FieldLot with this lotCode already exists');
    }

    const fieldLot = await this.prisma.fieldLot.create({
      data: {
        lotCode: dto.lotCode,
        supplier: dto.supplier,
        varietyId: dto.varietyId,
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
    paginationDto: PaginationDto,
    filters: QueryFiltersDto,
  ): Promise<PaginatedResponse<FieldLotResponseDto>> {
    const { skip, take } = getPaginationParams(paginationDto);
    const where: Prisma.FieldLotWhereInput = {};

    if (!filters.includeDeleted) {
      where.deletedAt = null;
    }

    if (filters.varietyId) {
      where.varietyId = filters.varietyId;
    }

    if (filters.productId) {
      where.variety = { productId: filters.productId };
    }

    if (filters.search) {
      where.OR = [
        { lotCode: { contains: filters.search } },
        { supplier: { contains: filters.search } },
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
        page: paginationDto.page ?? 1,
        limit: paginationDto.limit ?? 20,
        totalPages: Math.ceil(total / (paginationDto.limit ?? 20)),
      },
    };
  }

  async findById(id: string, includeDeleted = false): Promise<FieldLotResponseDto> {
    const where: Prisma.FieldLotWhereUniqueInput = { id };
    const fieldLot = await this.prisma.fieldLot.findUnique({
      where: includeDeleted ? where : { ...where, deletedAt: null },
    });

    if (!fieldLot) {
      throw new NotFoundException(`FieldLot with ID ${id} not found`);
    }

    return this.toResponse(fieldLot);
  }

  async findByIdWithDetails(id: string): Promise<FieldLotWithDetailsResponseDto> {
    const fieldLot = await this.prisma.fieldLot.findUnique({
      where: { id },
      include: { variety: true },
    });

    if (!fieldLot) {
      throw new NotFoundException(`FieldLot with ID ${id} not found`);
    }

    return {
      id: fieldLot.id,
      lotCode: fieldLot.lotCode,
      supplier: fieldLot.supplier,
      varietyId: fieldLot.varietyId,
      createdAt: fieldLot.createdAt,
      updatedAt: fieldLot.updatedAt,
      variety: fieldLot.variety,
    };
  }

  async update(id: string, dto: UpdateFieldLotDto, userId?: string): Promise<FieldLotResponseDto> {
    const fieldLot = await this.prisma.fieldLot.findUnique({
      where: { id, deletedAt: null },
    });

    if (!fieldLot) {
      throw new NotFoundException(`FieldLot with ID ${id} not found`);
    }

    if (dto.lotCode && dto.lotCode !== fieldLot.lotCode) {
      const existing = await this.prisma.fieldLot.findUnique({
        where: { lotCode: dto.lotCode },
      });
      if (existing) {
        throw new ConflictException('FieldLot with this lotCode already exists');
      }
    }

    const oldValue = this.toResponse(fieldLot);
    const updated = await this.prisma.fieldLot.update({
      where: { id },
      data: dto,
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

  async delete(id: string, force = false, userId?: string): Promise<void> {
    const fieldLot = await this.prisma.fieldLot.findUnique({
      where: { id },
    });

    if (!fieldLot) {
      throw new NotFoundException(`FieldLot with ID ${id} not found`);
    }

    if (force) {
      await this.prisma.fieldLot.delete({
        where: { id },
      });

      this.logger.log(`FieldLot hard deleted: ${id}`);
      
      this.auditQueue.push({
        userId,
        entity: ENTITY_NAME,
        entityId: id,
        operation: AuditOperation.HARD_DELETE,
        oldValue: this.toResponse(fieldLot) as unknown as Record<string, unknown>,
      });
    } else {
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
  }

  async restore(id: string, userId?: string): Promise<FieldLotResponseDto> {
    const fieldLot = await this.prisma.fieldLot.findUnique({
      where: { id },
    });

    if (!fieldLot) {
      throw new NotFoundException(`FieldLot with ID ${id} not found`);
    }

    if (!fieldLot.deletedAt) {
      throw new NotFoundException(`FieldLot with ID ${id} is not deleted`);
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

  private toResponse(fieldLot: { id: string; lotCode: string; supplier: string; varietyId: string; createdAt: Date; updatedAt: Date; deletedAt?: Date | null }) {
    return {
      id: fieldLot.id,
      lotCode: fieldLot.lotCode,
      supplier: fieldLot.supplier,
      varietyId: fieldLot.varietyId,
      createdAt: fieldLot.createdAt,
      updatedAt: fieldLot.updatedAt,
      deletedAt: fieldLot.deletedAt ?? null,
    };
  }
}
