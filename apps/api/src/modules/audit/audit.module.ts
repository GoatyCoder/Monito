import { Module, Global } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditQueueService } from '../../common/events/audit-queue.service';

@Global()
@Module({
  controllers: [AuditController],
  providers: [AuditService, AuditQueueService],
  exports: [AuditService, AuditQueueService],
})
export class AuditModule {}
