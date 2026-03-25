import { Module } from '@nestjs/common';
import { PackagingsService } from './packagings.service';
import { PackagingsController } from './packagings.controller';

@Module({
  controllers: [PackagingsController],
  providers: [PackagingsService],
  exports: [PackagingsService],
})
export class PackagingsModule {}
