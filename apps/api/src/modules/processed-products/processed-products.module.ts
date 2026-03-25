import { Module } from '@nestjs/common';
import { ProcessedProductsService } from './processed-products.service';
import { ProcessedProductsController } from './processed-products.controller';

@Module({
  controllers: [ProcessedProductsController],
  providers: [ProcessedProductsService],
  exports: [ProcessedProductsService],
})
export class ProcessedProductsModule {}