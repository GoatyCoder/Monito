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
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PalletsService } from './pallets.service';
import { CreatePalletDto, UpdatePalletDto, PalletResponseDto, PalletWithDetailsResponseDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { QueryFiltersDto } from '../../common/dto/query-filters.dto';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('pallets')
@Controller('pallets')
export class PalletsController {
  constructor(private readonly palletsService: PalletsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new pallet' })
  @ApiResponse({ status: 201, description: 'Pallet created', type: PalletResponseDto })
  @ApiResponse({ status: 404, description: 'Field lot or processed product not found' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async create(
    @Body() dto: CreatePalletDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PalletResponseDto> {
    return this.palletsService.create(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all pallets' })
  @ApiResponse({ status: 200, description: 'List of pallets' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query() filters: QueryFiltersDto,
  ): Promise<PaginatedResponse<PalletResponseDto>> {
    return this.palletsService.findAll(pagination, filters);
  }

  @Get('by-number/:palletNumber')
  @ApiOperation({ summary: 'Get pallet by number' })
  @ApiResponse({ status: 200, description: 'Pallet details', type: PalletWithDetailsResponseDto })
  @ApiResponse({ status: 404, description: 'Pallet not found' })
  async findByPalletNumber(
    @Param('palletNumber') palletNumber: string,
  ): Promise<PalletWithDetailsResponseDto> {
    return this.palletsService.findByPalletNumber(palletNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get pallet by ID' })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Pallet details', type: PalletWithDetailsResponseDto })
  @ApiResponse({ status: 404, description: 'Pallet not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeDeleted') includeDeleted?: string,
  ): Promise<PalletWithDetailsResponseDto> {
    return this.palletsService.findById(id, includeDeleted === 'true');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update pallet' })
  @ApiResponse({ status: 200, description: 'Pallet updated', type: PalletResponseDto })
  @ApiResponse({ status: 404, description: 'Pallet not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePalletDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PalletResponseDto> {
    return this.palletsService.update(id, dto, user?.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete pallet (soft delete by default)' })
  @ApiQuery({ name: 'force', required: false, type: Boolean, description: 'Set to true for hard delete' })
  @ApiResponse({ status: 204, description: 'Pallet deleted' })
  @ApiResponse({ status: 404, description: 'Pallet not found' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('force') force?: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<void> {
    return this.palletsService.delete(id, force === 'true', user?.sub);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted pallet' })
  @ApiResponse({ status: 200, description: 'Pallet restored', type: PalletResponseDto })
  @ApiResponse({ status: 404, description: 'Pallet not found or not deleted' })
  async restore(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<PalletResponseDto> {
    return this.palletsService.restore(id, user?.sub);
  }
}
