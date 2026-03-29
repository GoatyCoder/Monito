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
import { PalletsService } from './pallets.service';
import { CreatePalletDto, UpdatePalletDto, PalletResponseDto, PalletWithDetailsResponseDto } from './dto';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { PurgeRequestDto } from '../../common/dto/purge-request.dto';
import { Roles, RolesGuard } from '../auth/guards';

@ApiTags('pallets')
@ApiBearerAuth()
@Controller('pallets')
@UseGuards(RolesGuard)
export class PalletsController {
  constructor(private readonly palletsService: PalletsService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new pallet' })
  @ApiResponse({ status: 201, description: 'Pallet created', type: PalletResponseDto })
  @ApiResponse({ status: 404, description: 'Field lot or processed product not found' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async create(
    @Body() dto: CreatePalletDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PalletResponseDto> {
    return this.palletsService.create(dto, user.sub);
  }

  @Get()
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Get all pallets' })
  @ApiResponse({ status: 200, description: 'List of pallets' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async findAll(
    @Query() dto: ListQueryDto,
  ): Promise<PaginatedResponse<PalletResponseDto>> {
    return this.palletsService.findAll(dto);
  }

  @Get('deleted')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get soft-deleted pallets' })
  @ApiResponse({ status: 200, description: 'List of soft-deleted pallets' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async findDeleted(
    @Query() dto: ListQueryDto,
  ): Promise<PaginatedResponse<PalletResponseDto>> {
    return this.palletsService.findDeleted(dto);
  }

  @Get('deleted/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get soft-deleted pallet by ID' })
  @ApiResponse({ status: 200, description: 'Soft-deleted pallet details', type: PalletWithDetailsResponseDto })
  @ApiResponse({ status: 404, description: 'Soft-deleted pallet not found' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async findDeletedById(@Param('id') id: string): Promise<PalletWithDetailsResponseDto> {
    return this.palletsService.findDeletedById(id);
  }

  @Get('by-number/:palletNumber')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Get pallet by number' })
  @ApiResponse({ status: 200, description: 'Pallet details', type: PalletWithDetailsResponseDto })
  @ApiResponse({ status: 404, description: 'Pallet not found' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async findByPalletNumber(
    @Param('palletNumber') palletNumber: string,
  ): Promise<PalletWithDetailsResponseDto> {
    return this.palletsService.findByPalletNumber(palletNumber);
  }

  @Get(':id')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Get pallet by ID' })
  @ApiResponse({ status: 200, description: 'Pallet details', type: PalletWithDetailsResponseDto })
  @ApiResponse({ status: 404, description: 'Pallet not found' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async findById(
    @Param('id') id: string,
  ): Promise<PalletWithDetailsResponseDto> {
    return this.palletsService.findById(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update pallet' })
  @ApiResponse({ status: 200, description: 'Pallet updated', type: PalletResponseDto })
  @ApiResponse({ status: 404, description: 'Pallet not found' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePalletDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PalletResponseDto> {
    return this.palletsService.update(id, dto, user?.sub);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete pallet' })
  @ApiResponse({ status: 204, description: 'Pallet soft-deleted' })
  @ApiResponse({ status: 404, description: 'Pallet not found' })
  @ApiResponse({ status: 409, description: 'Pallet already deleted' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<void> {
    return this.palletsService.delete(id, user?.sub);
  }

  @Post(':id/restore')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore soft-deleted pallet' })
  @ApiResponse({ status: 200, description: 'Pallet restored', type: PalletResponseDto })
  @ApiResponse({ status: 404, description: 'Pallet not found' })
  @ApiResponse({ status: 409, description: 'Pallet is not deleted' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async restore(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<PalletResponseDto> {
    return this.palletsService.restore(id, user?.sub);
  }

  @Post(':id/purge')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Purge soft-deleted pallet permanently' })
  @ApiResponse({ status: 204, description: 'Pallet purged' })
  @ApiResponse({ status: 404, description: 'Pallet not found' })
  @ApiResponse({ status: 409, description: 'Pallet is active' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async purge(
    @Param('id') id: string,
    @Body() dto: PurgeRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.palletsService.purge(id, dto.reason, user?.sub);
  }
}
