import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { VarietiesService } from './varieties.service';
import { CreateVarietyDto, UpdateVarietyDto, VarietyResponseDto } from './dto';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { PurgeRequestDto } from '../../common/dto/purge-request.dto';
import { Roles, RolesGuard } from '../auth/guards';

@ApiTags('varieties')
@ApiBearerAuth()
@Controller('varieties')
@UseGuards(RolesGuard)
export class VarietiesController {
  constructor(private readonly varietiesService: VarietiesService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new variety' })
  @ApiResponse({ status: 201, description: 'Variety created', type: VarietyResponseDto })
  @ApiResponse({ status: 409, description: 'Code already exists' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async create(
    @Body() dto: CreateVarietyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<VarietyResponseDto> {
    return this.varietiesService.create(dto, user?.sub);
  }

  @Get()
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Get all varieties' })
  @ApiResponse({ status: 200, description: 'List of varieties' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async findAll(
    @Query() dto: ListQueryDto,
  ): Promise<PaginatedResponse<VarietyResponseDto>> {
    return this.varietiesService.findAll(dto);
  }

  @Get('deleted')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get soft-deleted varieties' })
  @ApiResponse({ status: 200, description: 'List of soft-deleted varieties' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async findDeleted(
    @Query() dto: ListQueryDto,
  ): Promise<PaginatedResponse<VarietyResponseDto>> {
    return this.varietiesService.findDeleted(dto);
  }

  @Get('deleted/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get soft-deleted variety by ID' })
  @ApiResponse({ status: 200, description: 'Soft-deleted variety details', type: VarietyResponseDto })
  @ApiResponse({ status: 404, description: 'Soft-deleted variety not found' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async findDeletedById(@Param('id') id: string): Promise<VarietyResponseDto> {
    return this.varietiesService.findDeletedById(id);
  }

  @Get(':id')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Get variety by ID' })
  @ApiResponse({ status: 200, description: 'Variety details', type: VarietyResponseDto })
  @ApiResponse({ status: 404, description: 'Variety not found' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async findById(
    @Param('id') id: string,
  ): Promise<VarietyResponseDto> {
    return this.varietiesService.findById(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update variety' })
  @ApiResponse({ status: 200, description: 'Variety updated', type: VarietyResponseDto })
  @ApiResponse({ status: 404, description: 'Variety not found' })
  @ApiResponse({ status: 409, description: 'Code already exists' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVarietyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<VarietyResponseDto> {
    return this.varietiesService.update(id, dto, user?.sub);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete variety' })
  @ApiResponse({ status: 204, description: 'Variety soft-deleted' })
  @ApiResponse({ status: 404, description: 'Variety not found' })
  @ApiResponse({ status: 409, description: 'Variety already deleted' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<void> {
    return this.varietiesService.delete(id, user?.sub);
  }

  @Post(':id/restore')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore soft-deleted variety' })
  @ApiResponse({ status: 200, description: 'Variety restored', type: VarietyResponseDto })
  @ApiResponse({ status: 404, description: 'Variety not found' })
  @ApiResponse({ status: 409, description: 'Variety is not deleted' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async restore(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<VarietyResponseDto> {
    return this.varietiesService.restore(id, user?.sub);
  }

  @Post(':id/purge')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Purge soft-deleted variety permanently' })
  @ApiResponse({ status: 204, description: 'Variety purged' })
  @ApiResponse({ status: 404, description: 'Variety not found' })
  @ApiResponse({ status: 409, description: 'Variety is active or still referenced' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async purge(
    @Param('id') id: string,
    @Body() dto: PurgeRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.varietiesService.purge(id, dto.reason, user?.sub);
  }
}
