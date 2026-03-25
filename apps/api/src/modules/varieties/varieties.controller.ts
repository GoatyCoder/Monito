import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { VarietiesService } from './varieties.service';
import { CreateVarietyDto, UpdateVarietyDto, VarietyResponseDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { QueryFiltersDto } from '../../common/dto/query-filters.dto';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('varieties')
@Controller('varieties')
export class VarietiesController {
  constructor(private readonly varietiesService: VarietiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new variety' })
  @ApiResponse({ status: 201, description: 'Variety created', type: VarietyResponseDto })
  @ApiResponse({ status: 409, description: 'Code already exists' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async create(
    @Body() dto: CreateVarietyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<VarietyResponseDto> {
    return this.varietiesService.create(dto, user?.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all varieties' })
  @ApiResponse({ status: 200, description: 'List of varieties' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query() filters: QueryFiltersDto,
  ): Promise<PaginatedResponse<VarietyResponseDto>> {
    return this.varietiesService.findAll(pagination, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get variety by ID' })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Variety details', type: VarietyResponseDto })
  @ApiResponse({ status: 404, description: 'Variety not found' })
  async findById(
    @Param('id') id: string,
    @Query('includeDeleted') includeDeleted?: string,
  ): Promise<VarietyResponseDto> {
    return this.varietiesService.findById(id, includeDeleted === 'true');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update variety' })
  @ApiResponse({ status: 200, description: 'Variety updated', type: VarietyResponseDto })
  @ApiResponse({ status: 404, description: 'Variety not found' })
  @ApiResponse({ status: 409, description: 'Code already exists' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVarietyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<VarietyResponseDto> {
    return this.varietiesService.update(id, dto, user?.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete variety (soft delete by default)' })
  @ApiQuery({ name: 'force', required: false, type: Boolean, description: 'Set to true for hard delete' })
  @ApiResponse({ status: 204, description: 'Variety deleted' })
  @ApiResponse({ status: 404, description: 'Variety not found' })
  async delete(
    @Param('id') id: string,
    @Query('force') force?: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<void> {
    return this.varietiesService.delete(id, force === 'true', user?.sub);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted variety' })
  @ApiResponse({ status: 200, description: 'Variety restored', type: VarietyResponseDto })
  @ApiResponse({ status: 404, description: 'Variety not found or not deleted' })
  async restore(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<VarietyResponseDto> {
    return this.varietiesService.restore(id, user?.sub);
  }
}
