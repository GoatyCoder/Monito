import { AxiosError } from 'axios';
import { translateErrorCode } from './error-messages';

type ApiErrorShape = {
  message?: string | string[];
  code?: string;
};

function getApiErrorShape(error: unknown): ApiErrorShape | undefined {
  if (!(error instanceof AxiosError)) {
    return undefined;
  }

  const data = error.response?.data as ApiErrorShape | undefined;
  return data;
}

export function getApiErrorCode(error: unknown): string | undefined {
  return getApiErrorShape(error)?.code;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const data = getApiErrorShape(error);
  const translated = translateErrorCode(data?.code);
  if (translated) {
    return translated;
  }

  if (Array.isArray(data?.message) && data.message.length > 0) {
    return data.message[0] ?? fallback;
  }

  return fallback;
}
