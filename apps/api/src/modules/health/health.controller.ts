import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get('liveness')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Service process is alive' })
  getLiveness(): { status: 'ok'; timestamp: string; uptimeSec: number } {
    return this.healthService.getLiveness();
  }

  @Public()
  @Get('readiness')
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Service is ready to serve traffic' })
  @ApiResponse({ status: 503, description: 'Service dependencies are unavailable' })
  async getReadiness(): Promise<{
    status: 'ready' | 'degraded' | 'not_ready';
    timestamp: string;
    checks: {
      database: 'up' | 'down';
      redis: 'up' | 'down' | 'skipped';
    };
  }> {
    const readiness = await this.healthService.getReadiness();
    if (readiness.status === 'not_ready') {
      throw new ServiceUnavailableException(readiness);
    }

    return readiness;
  }
}
