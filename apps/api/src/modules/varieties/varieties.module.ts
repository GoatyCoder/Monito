import { Module } from '@nestjs/common';
import { VarietiesService } from './varieties.service';
import { VarietiesController } from './varieties.controller';
import { ProductVarietiesController } from './product-varieties.controller';

@Module({
  controllers: [VarietiesController, ProductVarietiesController],
  providers: [VarietiesService],
  exports: [VarietiesService],
})
export class VarietiesModule {}
