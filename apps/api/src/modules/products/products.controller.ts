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
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductResponseDto, ProductWithVarietiesResponseDto } from './dto';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created', type: ProductResponseDto })
  @ApiResponse({ status: 409, description: 'Code already exists' })
  async create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProductResponseDto> {
    return this.productsService.create(dto, user?.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'List of products' })
  async findAll(
    @Query() dto: ListQueryDto,
  ): Promise<PaginatedResponse<ProductResponseDto>> {
    return this.productsService.findAll(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID with varieties' })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Product details', type: ProductWithVarietiesResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findById(
    @Param('id') id: string,
    @Query('includeDeleted') includeDeleted?: string,
  ): Promise<ProductWithVarietiesResponseDto> {
    return this.productsService.findById(id, includeDeleted === 'true');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Code already exists' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProductResponseDto> {
    return this.productsService.update(id, dto, user?.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete product (soft delete by default)' })
  @ApiQuery({ name: 'force', required: false, type: Boolean, description: 'Set to true for hard delete' })
  @ApiResponse({ status: 204, description: 'Product deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async delete(
    @Param('id') id: string,
    @Query('force') force?: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<void> {
    return this.productsService.delete(id, force === 'true', user?.sub);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted product' })
  @ApiResponse({ status: 200, description: 'Product restored', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found or not deleted' })
  async restore(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProductResponseDto> {
    return this.productsService.restore(id, user?.sub);
  }
}
