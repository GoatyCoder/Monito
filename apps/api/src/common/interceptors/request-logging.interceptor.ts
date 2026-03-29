import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { RequestWithId } from '../middleware/request-id.middleware';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest<Request & RequestWithId>();
    const res = httpContext.getResponse<Response>();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logRequest(req, res, start);
        },
        error: () => {
          this.logRequest(req, res, start);
        },
      }),
    );
  }

  private logRequest(req: Request & RequestWithId, res: Response, start: number): void {
    const durationMs = Date.now() - start;
    const requestId = req.requestId ?? 'n/a';

    this.logger.log(
      JSON.stringify({
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
      }),
    );
  }
}
