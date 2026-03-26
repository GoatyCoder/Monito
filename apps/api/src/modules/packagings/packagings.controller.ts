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
import { PackagingsService } from './packagings.service';
import { CreatePackagingDto, UpdatePackagingDto, PackagingResponseDto } from './dto';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { PurgeRequestDto } from '../../common/dto/purge-request.dto';
import { Roles, RolesGuard } from '../auth/guards';

@ApiTags('packagings')
@ApiBearerAuth()
@Controller('packagings')
@UseGuards(RolesGuard)
export class PackagingsController {
  constructor(private readonly packagingsService: PackagingsService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new packaging' })
  @ApiResponse({ status: 201, description: 'Packaging created', type: PackagingResponseDto })
  @ApiResponse({ status: 409, description: 'Code already exists' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async create(
    @Body() dto: CreatePackagingDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PackagingResponseDto> {
    return this.packagingsService.create(dto, user?.sub);
  }

  @Get()
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Get all packagings' })
  @ApiResponse({ status: 200, description: 'List of packagings' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async findAll(
    @Query() dto: ListQueryDto,
  ): Promise<PaginatedResponse<PackagingResponseDto>> {
    return this.packagingsService.findAll(dto);
  }

  @Get('deleted')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get soft-deleted packagings' })
  @ApiResponse({ status: 200, description: 'List of soft-deleted packagings' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async findDeleted(
    @Query() dto: ListQueryDto,
  ): Promise<PaginatedResponse<PackagingResponseDto>> {
    return this.packagingsService.findDeleted(dto);
  }

  @Get('deleted/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get soft-deleted packaging by ID' })
  @ApiResponse({ status: 200, description: 'Soft-deleted packaging details', type: PackagingResponseDto })
  @ApiResponse({ status: 404, description: 'Soft-deleted packaging not found' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async findDeletedById(@Param('id') id: string): Promise<PackagingResponseDto> {
    return this.packagingsService.findDeletedById(id);
  }

  @Get('all')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Get all active packagings without pagination' })
  @ApiResponse({ status: 200, description: 'All active packagings', type: [PackagingResponseDto] })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async findAllActive(): Promise<PackagingResponseDto[]> {
    return this.packagingsService.findAllActive();
  }

  @Get(':id')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Get packaging by ID' })
  @ApiResponse({ status: 200, description: 'Packaging details', type: PackagingResponseDto })
  @ApiResponse({ status: 404, description: 'Packaging not found' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async findById(
    @Param('id') id: string,
  ): Promise<PackagingResponseDto> {
    return this.packagingsService.findById(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update packaging' })
  @ApiResponse({ status: 200, description: 'Packaging updated', type: PackagingResponseDto })
  @ApiResponse({ status: 404, description: 'Packaging not found' })
  @ApiResponse({ status: 409, description: 'Code already exists' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePackagingDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PackagingResponseDto> {
    return this.packagingsService.update(id, dto, user?.sub);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete packaging' })
  @ApiResponse({ status: 204, description: 'Packaging soft-deleted' })
  @ApiResponse({ status: 404, description: 'Packaging not found' })
  @ApiResponse({ status: 409, description: 'Packaging already deleted' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<void> {
    return this.packagingsService.delete(id, user?.sub);
  }

  @Post(':id/restore')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore soft-deleted packaging' })
  @ApiResponse({ status: 200, description: 'Packaging restored', type: PackagingResponseDto })
  @ApiResponse({ status: 404, description: 'Packaging not found' })
  @ApiResponse({ status: 409, description: 'Packaging is not deleted' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async restore(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<PackagingResponseDto> {
    return this.packagingsService.restore(id, user?.sub);
  }

  @Post(':id/purge')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Purge soft-deleted packaging permanently' })
  @ApiResponse({ status: 204, description: 'Packaging purged' })
  @ApiResponse({ status: 404, description: 'Packaging not found' })
  @ApiResponse({ status: 409, description: 'Packaging is active or still referenced' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async purge(
    @Param('id') id: string,
    @Body() dto: PurgeRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.packagingsService.purge(id, dto.reason, user?.sub);
  }
}
