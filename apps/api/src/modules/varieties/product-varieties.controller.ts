import {
  Controller,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiForbiddenResponse } from '@nestjs/swagger';
import { VarietiesService } from './varieties.service';
import { VarietyResponseDto } from './dto';
import { Roles, RolesGuard } from '../auth/guards';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products/:productId/varieties')
@UseGuards(RolesGuard)
export class ProductVarietiesController {
  constructor(private readonly varietiesService: VarietiesService) {}

  @Get()
  @Roles('ADMIN', 'OPERATOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all varieties for a product' })
  @ApiResponse({ status: 200, description: 'List of varieties', type: [VarietyResponseDto] })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async findByProductId(
    @Param('productId') productId: string,
  ): Promise<VarietyResponseDto[]> {
    return this.varietiesService.findByProductId(productId);
  }
}
