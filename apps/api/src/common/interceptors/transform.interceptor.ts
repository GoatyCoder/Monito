import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | PaginatedResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T> | PaginatedResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'meta' in data) {
          return data as PaginatedResponse<T>;
        }
        return { data } as ApiResponse<T>;
      }),
    );
  }
}
