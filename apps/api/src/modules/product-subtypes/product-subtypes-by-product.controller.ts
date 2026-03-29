import { Controller, Get, HttpCode, HttpStatus, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles, RolesGuard } from '../auth/guards';
import { ProductSubtypeResponseDto } from './dto';
import { ProductSubtypesService } from './product-subtypes.service';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products/:productId/subtypes')
@UseGuards(RolesGuard)
export class ProductSubtypesByProductController {
  constructor(private readonly productSubtypesService: ProductSubtypesService) {}

  @Get('all')
  @Roles('ADMIN', 'OPERATOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all active subtypes for a product' })
  @ApiResponse({ status: 200, description: 'List of product subtypes', type: [ProductSubtypeResponseDto] })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async findByProductId(@Param('productId') productId: string): Promise<ProductSubtypeResponseDto[]> {
    return this.productSubtypesService.findByProductId(productId);
  }
}
