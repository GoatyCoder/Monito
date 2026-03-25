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
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { FieldLotsService } from './field-lots.service';
import { CreateFieldLotDto, UpdateFieldLotDto, FieldLotResponseDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { QueryFiltersDto } from '../../common/dto/query-filters.dto';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiBearerAuth()
@ApiTags('field-lots')
@Controller('field-lots')
export class FieldLotsController {
  constructor(private readonly fieldLotsService: FieldLotsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new field lot' })
  @ApiResponse({ status: 201, description: 'FieldLot created', type: FieldLotResponseDto })
  @ApiResponse({ status: 404, description: 'Variety not found' })
  async create(
    @Body() dto: CreateFieldLotDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<FieldLotResponseDto> {
    return this.fieldLotsService.create(dto, user?.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all field lots' })
  @ApiResponse({ status: 200, description: 'List of field lots' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query() filters: QueryFiltersDto,
  ): Promise<PaginatedResponse<FieldLotResponseDto>> {
    return this.fieldLotsService.findAll(pagination, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get field lot by ID' })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'FieldLot details', type: FieldLotResponseDto })
  @ApiResponse({ status: 404, description: 'FieldLot not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeDeleted') includeDeleted?: string,
  ): Promise<FieldLotResponseDto> {
    return this.fieldLotsService.findById(id, includeDeleted === 'true');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update field lot' })
  @ApiResponse({ status: 200, description: 'FieldLot updated', type: FieldLotResponseDto })
  @ApiResponse({ status: 404, description: 'FieldLot not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFieldLotDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<FieldLotResponseDto> {
    return this.fieldLotsService.update(id, dto, user?.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete field lot (soft delete by default)' })
  @ApiQuery({ name: 'force', required: false, type: Boolean, description: 'Set to true for hard delete' })
  @ApiResponse({ status: 204, description: 'FieldLot deleted' })
  @ApiResponse({ status: 404, description: 'FieldLot not found' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('force') force?: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<void> {
    return this.fieldLotsService.delete(id, force === 'true', user?.sub);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted field lot' })
  @ApiResponse({ status: 200, description: 'FieldLot restored', type: FieldLotResponseDto })
  @ApiResponse({ status: 404, description: 'FieldLot not found or not deleted' })
  async restore(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<FieldLotResponseDto> {
    return this.fieldLotsService.restore(id, user?.sub);
  }
}
