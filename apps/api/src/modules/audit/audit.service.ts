import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { CreateAuditLogDto, AuditOperation } from './dto/create-audit-log.dto';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(dto: CreateAuditLogDto): Promise<AuditLogResponseDto> {
    const auditLog = await this.prisma.auditLog.create({
      data: {
        userId: dto.userId,
        entity: dto.entity,
        entityId: dto.entityId,
        operation: dto.operation,
        oldValue: dto.oldValue ? JSON.stringify(dto.oldValue) : null,
        newValue: dto.newValue ? JSON.stringify(dto.newValue) : null,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      },
    });

    this.logger.debug(`Audit log created: ${dto.entity}.${dto.operation} on ${dto.entityId}`);
    return this.toResponse(auditLog);
  }

  async findAll(params: {
    entity?: string;
    entities?: string[];
    entityId?: string;
    userId?: string;
    userIds?: string[];
    operation?: AuditOperation;
    operations?: string[];
    startDate?: Date;
    endDate?: Date;
    sort?: 'timestamp_desc' | 'timestamp_asc';
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<AuditLogResponseDto>> {
    const {
      entity,
      entities,
      entityId,
      userId,
      userIds,
      operation,
      operations,
      startDate,
      endDate,
      sort = 'timestamp_desc',
      page = 1,
      limit = 20,
    } = params;

    const where: Record<string, unknown> = {};

    if (entity) where.entity = entity;
    if (entities && entities.length > 0) where.entity = { in: entities };
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;
    if (userIds && userIds.length > 0) where.userId = { in: userIds };
    if (operation) where.operation = operation;
    if (operations && operations.length > 0) where.operation = { in: operations };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) (where.timestamp as Record<string, Date>).gte = startDate;
      if (endDate) (where.timestamp as Record<string, Date>).lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { timestamp: sort === 'timestamp_asc' ? 'asc' : 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const userIdsInLogs = [...new Set(logs.map((log) => log.userId).filter(Boolean))] as string[];
    const usersById = new Map<string, { username: string; firstName: string; surname: string }>();

    if (userIdsInLogs.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIdsInLogs } },
        select: {
          id: true,
          username: true,
          firstName: true,
          surname: true,
        },
      });

      users.forEach((user) => {
        usersById.set(user.id, {
          username: user.username,
          firstName: user.firstName,
          surname: user.surname,
        });
      });
    }

    return {
      data: logs.map((log) => this.toResponse(log, usersById.get(log.userId ?? ''))),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private toResponse(
    log: {
    id: string;
    userId: string | null;
    entity: string;
    entityId: string;
    operation: string;
    oldValue: string | null;
    newValue: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    timestamp: Date;
    },
    user?: { username: string; firstName: string; surname: string },
  ): AuditLogResponseDto {
    return {
      id: log.id,
      userId: log.userId,
      username: user?.username ?? null,
      userDisplayName: user ? `${user.firstName} ${user.surname}`.trim() : null,
      entity: log.entity,
      entityId: log.entityId,
      operation: log.operation,
      oldValue: log.oldValue ? JSON.parse(log.oldValue) : null,
      newValue: log.newValue ? JSON.parse(log.newValue) : null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      timestamp: log.timestamp,
    };
  }
}
