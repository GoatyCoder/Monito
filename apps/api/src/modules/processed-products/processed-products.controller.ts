import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
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
import { ProcessedProductsService } from './processed-products.service';
import {
  CreateProcessedProductDto,
  UpdateProcessedProductDto,
  ProcessedProductResponseDto,
} from './dto';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { PurgeRequestDto } from '../../common/dto/purge-request.dto';
import { Roles, RolesGuard } from '../auth/guards';

@ApiTags('processed-products')
@ApiBearerAuth()
@Controller('processed-products')
@UseGuards(RolesGuard)
export class ProcessedProductsController {
  constructor(
    private readonly processedProductsService: ProcessedProductsService,
  ) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new processed product' })
  @ApiResponse({ status: 201, type: ProcessedProductResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  create(
    @Body() createDto: CreateProcessedProductDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.processedProductsService.create(createDto, user?.sub);
  }

  @Get()
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Get all processed products' })
  @ApiResponse({ status: 200, description: 'List of processed products' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  findAll(
    @Query() dto: ListQueryDto,
  ): Promise<PaginatedResponse<ProcessedProductResponseDto>> {
    return this.processedProductsService.findAll(dto);
  }

  @Get('deleted')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get soft-deleted processed products' })
  @ApiResponse({ status: 200, description: 'List of soft-deleted processed products' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  findDeleted(
    @Query() dto: ListQueryDto,
  ): Promise<PaginatedResponse<ProcessedProductResponseDto>> {
    return this.processedProductsService.findDeleted(dto);
  }

  @Get('deleted/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get soft-deleted processed product by ID' })
  @ApiResponse({ status: 200, type: ProcessedProductResponseDto })
  @ApiResponse({ status: 404, description: 'Soft-deleted processed product not found' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  findDeletedById(@Param('id') id: string): Promise<ProcessedProductResponseDto> {
    return this.processedProductsService.findDeletedById(id);
  }

  @Get('all')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Get all active processed products without pagination' })
  @ApiResponse({ status: 200, description: 'All active processed products', type: [ProcessedProductResponseDto] })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  findAllActive(): Promise<ProcessedProductResponseDto[]> {
    return this.processedProductsService.findAllActive();
  }

  @Get(':id')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Get a processed product by ID' })
  @ApiResponse({ status: 200, type: ProcessedProductResponseDto })
  @ApiResponse({ status: 404, description: 'Processed product not found' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  findById(
    @Param('id') id: string,
  ) {
    return this.processedProductsService.findById(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a processed product' })
  @ApiResponse({ status: 200, type: ProcessedProductResponseDto })
  @ApiResponse({ status: 404, description: 'Processed product not found' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProcessedProductDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.processedProductsService.update(id, updateDto, user?.sub);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete processed product' })
  @ApiResponse({ status: 204, description: 'Processed product soft-deleted' })
  @ApiResponse({ status: 404, description: 'Processed product not found' })
  @ApiResponse({ status: 409, description: 'Processed product already deleted' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  delete(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.processedProductsService.delete(id, user?.sub);
  }

  @Post(':id/restore')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore soft-deleted processed product' })
  @ApiResponse({ status: 200, type: ProcessedProductResponseDto })
  @ApiResponse({ status: 404, description: 'Processed product not found' })
  @ApiResponse({ status: 409, description: 'Processed product is not deleted' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  restore(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.processedProductsService.restore(id, user?.sub);
  }

  @Post(':id/purge')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Purge soft-deleted processed product permanently' })
  @ApiResponse({ status: 204, description: 'Processed product purged' })
  @ApiResponse({ status: 404, description: 'Processed product not found' })
  @ApiResponse({ status: 409, description: 'Processed product is active or still referenced' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  purge(
    @Param('id') id: string,
    @Body() dto: PurgeRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.processedProductsService.purge(id, dto.reason, user?.sub);
  }
}
