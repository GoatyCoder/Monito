import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
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

@ApiTags('processed-products')
@ApiBearerAuth()
@Controller('processed-products')
export class ProcessedProductsController {
  constructor(
    private readonly processedProductsService: ProcessedProductsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new processed product' })
  @ApiResponse({ status: 201, type: ProcessedProductResponseDto })
  create(
    @Body() createDto: CreateProcessedProductDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.processedProductsService.create(createDto, user?.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all processed products' })
  @ApiResponse({ status: 200, description: 'List of processed products' })
  findAll(
    @Query() dto: ListQueryDto,
  ): Promise<PaginatedResponse<ProcessedProductResponseDto>> {
    return this.processedProductsService.findAll(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a processed product by ID' })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: ProcessedProductResponseDto })
  @ApiResponse({ status: 404, description: 'Processed product not found' })
  findOne(
    @Param('id') id: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.processedProductsService.findOne(id, includeDeleted === 'true');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a processed product' })
  @ApiResponse({ status: 200, type: ProcessedProductResponseDto })
  @ApiResponse({ status: 404, description: 'Processed product not found' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProcessedProductDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.processedProductsService.update(id, updateDto, user?.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete processed product (soft delete by default)' })
  @ApiQuery({ name: 'force', required: false, type: Boolean, description: 'Set to true for hard delete' })
  @ApiResponse({ status: 204, description: 'Processed product deleted' })
  @ApiResponse({ status: 404, description: 'Processed product not found' })
  remove(
    @Param('id') id: string,
    @Query('force') force?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.processedProductsService.remove(id, force === 'true', user?.sub);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted processed product' })
  @ApiResponse({ status: 200, type: ProcessedProductResponseDto })
  @ApiResponse({ status: 404, description: 'Processed product not found or not deleted' })
  restore(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.processedProductsService.restore(id, user?.sub);
  }
}