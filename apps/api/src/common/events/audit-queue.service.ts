import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
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

const PROCESS_INTERVAL_MS = 1000;
const MAX_EVENTS_PER_CYCLE = 50;

@Injectable()
export class AuditQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuditQueueService.name);
  private queue: AuditEvent[] = [];
  private isProcessing = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly auditService: AuditService) {}

  onModuleInit() {
    this.startProcessor();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    await this.drainQueueOnShutdown();
  }

  push(event: AuditEvent): void {
    this.queue.push(event);
    this.logger.debug(`Audit event queued: ${event.entity}.${event.operation}`);
  }

  private startProcessor(): void {
    this.timer = setInterval(() => {
      void this.processQueue();
    }, PROCESS_INTERVAL_MS);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    let processedInCycle = 0;

    while (this.queue.length > 0 && processedInCycle < MAX_EVENTS_PER_CYCLE) {
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
        processedInCycle += 1;
      } catch (error) {
        this.logger.error(`Failed to process audit event: ${error}`);
        this.queue.unshift(event);
        break;
      }
    }

    this.isProcessing = false;
  }

  private async drainQueueOnShutdown(): Promise<void> {
    const startedAt = Date.now();
    const maxDrainTimeMs = 5000;

    while (this.queue.length > 0 && Date.now() - startedAt < maxDrainTimeMs) {
      await this.processQueue();
      if (this.isProcessing) {
        break;
      }
    }

    if (this.queue.length > 0) {
      this.logger.warn(
        `Audit queue shutdown with ${this.queue.length} pending events after ${maxDrainTimeMs}ms`,
      );
    }
  }
}
