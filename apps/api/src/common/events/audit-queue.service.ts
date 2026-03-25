import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AuditService } from '../../modules/audit/audit.service';
import { CreateAuditLogDto, AuditOperation } from '../../modules/audit/dto/create-audit-log.dto';

export interface AuditEvent {
  userId?: string;
  entity: string;
  entityId: string;
  operation: AuditOperation;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditQueueService implements OnModuleInit {
  private readonly logger = new Logger(AuditQueueService.name);
  private queue: AuditEvent[] = [];
  private isProcessing = false;

  constructor(private readonly auditService: AuditService) {}

  onModuleInit() {
    this.startProcessor();
  }

  push(event: AuditEvent): void {
    this.queue.push(event);
    this.logger.debug(`Audit event queued: ${event.entity}.${event.operation}`);
  }

  private startProcessor(): void {
    setInterval(() => {
      void this.processQueue();
    }, 1000);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (!event) continue;

      try {
        const dto: CreateAuditLogDto = {
          userId: event.userId,
          entity: event.entity,
          entityId: event.entityId,
          operation: event.operation,
          oldValue: event.oldValue,
          newValue: event.newValue,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
        };

        await this.auditService.log(dto);
      } catch (error) {
        this.logger.error(`Failed to process audit event: ${error}`);
        this.queue.unshift(event);
        break;
      }
    }

    this.isProcessing = false;
  }
}
