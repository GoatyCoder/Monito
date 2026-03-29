export interface ApiErrorResponse {
  statusCode: number;
  code: string;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  requestId?: string;
  details?: unknown;
}
