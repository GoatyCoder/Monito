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
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { PackagingsService } from './packagings.service';
import { CreatePackagingDto, UpdatePackagingDto, PackagingResponseDto } from './dto';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('packagings')
@ApiBearerAuth()
@Controller('packagings')
export class PackagingsController {
  constructor(private readonly packagingsService: PackagingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new packaging' })
  @ApiResponse({ status: 201, description: 'Packaging created', type: PackagingResponseDto })
  @ApiResponse({ status: 409, description: 'Code already exists' })
  async create(
    @Body() dto: CreatePackagingDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PackagingResponseDto> {
    return this.packagingsService.create(dto, user?.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all packagings' })
  @ApiResponse({ status: 200, description: 'List of packagings' })
  async findAll(
    @Query() dto: ListQueryDto,
  ): Promise<PaginatedResponse<PackagingResponseDto>> {
    return this.packagingsService.findAll(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get packaging by ID' })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Packaging details', type: PackagingResponseDto })
  @ApiResponse({ status: 404, description: 'Packaging not found' })
  async findById(
    @Param('id') id: string,
    @Query('includeDeleted') includeDeleted?: string,
  ): Promise<PackagingResponseDto> {
    return this.packagingsService.findById(id, includeDeleted === 'true');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update packaging' })
  @ApiResponse({ status: 200, description: 'Packaging updated', type: PackagingResponseDto })
  @ApiResponse({ status: 404, description: 'Packaging not found' })
  @ApiResponse({ status: 409, description: 'Code already exists' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePackagingDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PackagingResponseDto> {
    return this.packagingsService.update(id, dto, user?.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete packaging (soft delete by default)' })
  @ApiQuery({ name: 'force', required: false, type: Boolean, description: 'Set to true for hard delete' })
  @ApiResponse({ status: 204, description: 'Packaging deleted' })
  @ApiResponse({ status: 404, description: 'Packaging not found' })
  async delete(
    @Param('id') id: string,
    @Query('force') force?: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<void> {
    return this.packagingsService.delete(id, force === 'true', user?.sub);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted packaging' })
  @ApiResponse({ status: 200, description: 'Packaging restored', type: PackagingResponseDto })
  @ApiResponse({ status: 404, description: 'Packaging not found or not deleted' })
  async restore(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<PackagingResponseDto> {
    return this.packagingsService.restore(id, user?.sub);
  }
}
