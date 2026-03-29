import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { Roles, RolesGuard } from '../auth/guards';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Get all audit logs with filters' })
  @ApiResponse({ status: 200, description: 'Paginated audit logs list' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async findAll(@Query() query: AuditQueryDto): Promise<PaginatedResponse<AuditLogResponseDto>> {
    return this.auditService.findAll({
      entity: query.entity,
      entities: this.parseCsv(query.entities),
      entityId: query.entityId,
      userId: query.userId,
      userIds: this.parseCsv(query.userIds),
      operation: query.operation,
      operations: this.parseCsv(query.operations),
      startDate: this.parseStartDate(query.startDate),
      endDate: this.parseEndDate(query.endDate),
      sort: query.sort,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('entity/:entity')
  @ApiOperation({ summary: 'Get audit logs by entity type' })
  @ApiParam({ name: 'entity', description: 'Entity name (e.g., Product, Variety)' })
  @ApiResponse({ status: 200, description: 'Paginated audit logs list for entity' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async findByEntity(
    @Param('entity') entity: string,
    @Query() query: AuditQueryDto,
  ): Promise<PaginatedResponse<AuditLogResponseDto>> {
    return this.auditService.findAll({
      entity,
      startDate: this.parseStartDate(query.startDate),
      endDate: this.parseEndDate(query.endDate),
      sort: query.sort,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('entity/:entity/:entityId')
  @ApiOperation({ summary: 'Get audit logs for specific entity record' })
  @ApiParam({ name: 'entity', description: 'Entity name (e.g., Product, Variety)' })
  @ApiParam({ name: 'entityId', description: 'Entity ID (CUID or string)' })
  @ApiResponse({ status: 200, description: 'Paginated audit logs list for entity record' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async findByEntityAndId(
    @Param('entity') entity: string,
    @Param('entityId') entityId: string,
    @Query() query: AuditQueryDto,
  ): Promise<PaginatedResponse<AuditLogResponseDto>> {
    return this.auditService.findAll({
      entity,
      entityId,
      startDate: this.parseStartDate(query.startDate),
      endDate: this.parseEndDate(query.endDate),
      sort: query.sort,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get audit logs by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID (CUID)' })
  @ApiResponse({ status: 200, description: 'Paginated audit logs list for user' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async findByUser(
    @Param('userId') userId: string,
    @Query() query: AuditQueryDto,
  ): Promise<PaginatedResponse<AuditLogResponseDto>> {
    return this.auditService.findAll({
      userId,
      startDate: this.parseStartDate(query.startDate),
      endDate: this.parseEndDate(query.endDate),
      sort: query.sort,
      page: query.page,
      limit: query.limit,
    });
  }

  private parseCsv(value?: string): string[] | undefined {
    if (!value) return undefined;
    const parsed = value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    return parsed.length > 0 ? parsed : undefined;
  }

  private parseStartDate(value?: string): Date | undefined {
    if (!value) return undefined;

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T00:00:00.000`);
    }

    return new Date(value);
  }

  private parseEndDate(value?: string): Date | undefined {
    if (!value) return undefined;

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T23:59:59.999`);
    }

    return new Date(value);
  }
}
