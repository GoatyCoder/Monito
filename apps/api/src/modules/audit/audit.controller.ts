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
      entityId: query.entityId,
      userId: query.userId,
      operation: query.operation,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
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
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
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
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
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
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      page: query.page,
      limit: query.limit,
    });
  }
}
