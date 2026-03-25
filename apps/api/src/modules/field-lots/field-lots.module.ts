import { Module } from '@nestjs/common';
import { FieldLotsController } from './field-lots.controller';
import { FieldLotsService } from './field-lots.service';

@Module({
  controllers: [FieldLotsController],
  providers: [FieldLotsService],
  exports: [FieldLotsService],
})
export class FieldLotsModule {}
