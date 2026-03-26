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
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductResponseDto, ProductWithVarietiesResponseDto } from './dto';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { PurgeRequestDto } from '../../common/dto/purge-request.dto';
import { Roles, RolesGuard } from '../auth/guards';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
@UseGuards(RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created', type: ProductResponseDto })
  @ApiResponse({ status: 409, description: 'Code already exists' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProductResponseDto> {
    return this.productsService.create(dto, user?.sub);
  }

  @Get()
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'List of products' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async findAll(
    @Query() dto: ListQueryDto,
  ): Promise<PaginatedResponse<ProductResponseDto>> {
    return this.productsService.findAll(dto);
  }

  @Get('deleted')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get soft-deleted products' })
  @ApiResponse({ status: 200, description: 'List of soft-deleted products' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async findDeleted(
    @Query() dto: ListQueryDto,
  ): Promise<PaginatedResponse<ProductResponseDto>> {
    return this.productsService.findDeleted(dto);
  }

  @Get('deleted/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get soft-deleted product by ID' })
  @ApiResponse({ status: 200, description: 'Soft-deleted product details', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Soft-deleted product not found' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async findDeletedById(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.productsService.findDeletedById(id);
  }

  @Get(':id')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Get product by ID with varieties' })
  @ApiResponse({ status: 200, description: 'Product details', type: ProductWithVarietiesResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async findById(
    @Param('id') id: string,
  ): Promise<ProductWithVarietiesResponseDto> {
    return this.productsService.findById(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Code already exists' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProductResponseDto> {
    return this.productsService.update(id, dto, user?.sub);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete product' })
  @ApiResponse({ status: 204, description: 'Product soft-deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Product already deleted' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<void> {
    return this.productsService.delete(id, user?.sub);
  }

  @Post(':id/restore')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore soft-deleted product' })
  @ApiResponse({ status: 200, description: 'Product restored', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Product is not deleted' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async restore(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProductResponseDto> {
    return this.productsService.restore(id, user?.sub);
  }

  @Post(':id/purge')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Purge soft-deleted product permanently' })
  @ApiResponse({ status: 204, description: 'Product purged' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Product is active or still referenced' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async purge(
    @Param('id') id: string,
    @Body() dto: PurgeRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.productsService.purge(id, dto.reason, user?.sub);
  }
}
