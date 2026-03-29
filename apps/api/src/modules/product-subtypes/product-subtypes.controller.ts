import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { PurgeRequestDto } from '../../common/dto/purge-request.dto';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles, RolesGuard } from '../auth/guards';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import {
  CreateProductSubtypeDto,
  ProductSubtypeResponseDto,
  UpdateProductSubtypeDto,
} from './dto';
import { ProductSubtypesService } from './product-subtypes.service';

@ApiTags('product-subtypes')
@ApiBearerAuth()
@Controller('product-subtypes')
@UseGuards(RolesGuard)
export class ProductSubtypesController {
  constructor(private readonly productSubtypesService: ProductSubtypesService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new product subtype' })
  @ApiResponse({ status: 201, description: 'Product subtype created', type: ProductSubtypeResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Subtype code already exists for the product' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async create(
    @Body() dto: CreateProductSubtypeDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProductSubtypeResponseDto> {
    return this.productSubtypesService.create(dto, user?.sub);
  }

  @Get()
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Get all product subtypes' })
  @ApiResponse({ status: 200, description: 'List of product subtypes' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async findAll(@Query() dto: ListQueryDto): Promise<PaginatedResponse<ProductSubtypeResponseDto>> {
    return this.productSubtypesService.findAll(dto);
  }

  @Get('deleted')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get soft-deleted product subtypes' })
  @ApiResponse({ status: 200, description: 'List of soft-deleted product subtypes' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async findDeleted(@Query() dto: ListQueryDto): Promise<PaginatedResponse<ProductSubtypeResponseDto>> {
    return this.productSubtypesService.findDeleted(dto);
  }

  @Get('deleted/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get soft-deleted product subtype by ID' })
  @ApiResponse({ status: 200, description: 'Soft-deleted product subtype details', type: ProductSubtypeResponseDto })
  @ApiResponse({ status: 404, description: 'Soft-deleted product subtype not found' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async findDeletedById(@Param('id') id: string): Promise<ProductSubtypeResponseDto> {
    return this.productSubtypesService.findDeletedById(id);
  }

  @Get('all')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Get all active product subtypes without pagination' })
  @ApiResponse({ status: 200, description: 'All active product subtypes', type: [ProductSubtypeResponseDto] })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async findAllActive(): Promise<ProductSubtypeResponseDto[]> {
    return this.productSubtypesService.findAllActive();
  }

  @Get(':id')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Get product subtype by ID' })
  @ApiResponse({ status: 200, description: 'Product subtype details', type: ProductSubtypeResponseDto })
  @ApiResponse({ status: 404, description: 'Product subtype not found' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async findById(@Param('id') id: string): Promise<ProductSubtypeResponseDto> {
    return this.productSubtypesService.findById(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update product subtype' })
  @ApiResponse({ status: 200, description: 'Product subtype updated', type: ProductSubtypeResponseDto })
  @ApiResponse({ status: 404, description: 'Product subtype not found' })
  @ApiResponse({ status: 409, description: 'Subtype code already exists for the product' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductSubtypeDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProductSubtypeResponseDto> {
    return this.productSubtypesService.update(id, dto, user?.sub);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete product subtype' })
  @ApiResponse({ status: 204, description: 'Product subtype soft-deleted' })
  @ApiResponse({ status: 404, description: 'Product subtype not found' })
  @ApiResponse({ status: 409, description: 'Product subtype already deleted' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async delete(@Param('id') id: string, @CurrentUser() user?: JwtPayload): Promise<void> {
    await this.productSubtypesService.delete(id, user?.sub);
  }

  @Post(':id/restore')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore soft-deleted product subtype' })
  @ApiResponse({ status: 200, description: 'Product subtype restored', type: ProductSubtypeResponseDto })
  @ApiResponse({ status: 404, description: 'Product subtype not found' })
  @ApiResponse({ status: 409, description: 'Product subtype is not deleted or code conflict detected' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async restore(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<ProductSubtypeResponseDto> {
    return this.productSubtypesService.restore(id, user?.sub);
  }

  @Post(':id/purge')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Purge soft-deleted product subtype permanently' })
  @ApiResponse({ status: 204, description: 'Product subtype purged' })
  @ApiResponse({ status: 404, description: 'Product subtype not found' })
  @ApiResponse({ status: 409, description: 'Product subtype is active or still referenced' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async purge(
    @Param('id') id: string,
    @Body() dto: PurgeRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.productSubtypesService.purge(id, dto.reason, user?.sub);
  }
}
