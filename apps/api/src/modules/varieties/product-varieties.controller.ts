import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VarietiesService } from './varieties.service';
import { VarietyResponseDto } from './dto';

@ApiBearerAuth()
@ApiTags('products')
@Controller('products/:productId/varieties')
export class ProductVarietiesController {
  constructor(private readonly varietiesService: VarietiesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all varieties for a product' })
  @ApiResponse({ status: 200, description: 'List of varieties', type: [VarietyResponseDto] })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findByProductId(
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<VarietyResponseDto[]> {
    return this.varietiesService.findByProductId(productId);
  }
}
