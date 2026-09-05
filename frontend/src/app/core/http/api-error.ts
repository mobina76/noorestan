import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetails } from '../api/contracts';

export interface ApiErrorInfo {
  readonly title: string;
  readonly fieldErrors: Readonly<Record<string, string>>;
  readonly status: number;
  readonly version?: number;
}

const FALLBACK_TITLE = 'خطایی رخ داد. دوباره تلاش کنید.';

export function readApiError(error: unknown): ApiErrorInfo {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as (ProblemDetails & { version?: number }) | null;
    const fieldErrors: Record<string, string> = {};
    if (body?.errors) {
      for (const [key, messages] of Object.entries(body.errors)) {
        if (messages.length > 0) fieldErrors[key] = messages[0];
      }
    }
    return {
      title: body?.title ?? FALLBACK_TITLE,
      fieldErrors,
      status: error.status,
      version: body?.version,
    };
  }
  return { title: FALLBACK_TITLE, fieldErrors: {}, status: 0 };
}
