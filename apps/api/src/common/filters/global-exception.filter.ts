import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode, ErrorCodes, resolveErrorCode } from '../errors/error-codes';

interface ErrorResponse {
  statusCode: number;
  code: ErrorCode;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  requestId?: string;
  details?: unknown;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';
    let code: ErrorCode = ErrorCodes.INTERNAL_ERROR;
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string | string[]) ?? message;
        error = (resp.error as string) ?? this.getErrorName(status);
        code = (resp.code as ErrorCode) ?? code;
        details = resp.details;
      } else {
        error = this.getErrorName(status);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
    }

    if (!code) {
      code = ErrorCodes.INTERNAL_ERROR;
    }

    if (code === ErrorCodes.INTERNAL_ERROR || code === ErrorCodes.BAD_REQUEST) {
      const firstMessage = Array.isArray(message) ? message[0] : message;
      code = resolveErrorCode({ status, message: firstMessage, error });
    }

    if (!details && Array.isArray(message) && status === HttpStatus.BAD_REQUEST) {
      details = message;
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      code,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: (request as Request & { requestId?: string }).requestId,
      details,
    };

    response.status(status).json(errorResponse);
  }

  private getErrorName(status: number): string {
    const errorNames: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
    };
    return errorNames[status] ?? 'Error';
  }
}
