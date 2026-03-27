import { Module } from '@nestjs/common';
import { ProductSubtypesByProductController } from './product-subtypes-by-product.controller';
import { ProductSubtypesController } from './product-subtypes.controller';
import { ProductSubtypesService } from './product-subtypes.service';

@Module({
  controllers: [ProductSubtypesController, ProductSubtypesByProductController],
  providers: [ProductSubtypesService],
  exports: [ProductSubtypesService],
})
export class ProductSubtypesModule {}
