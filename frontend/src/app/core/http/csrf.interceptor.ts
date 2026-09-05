import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionStore } from '../auth/session.store';

export const csrfInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(SessionStore).session()?.csrfToken;
  const sameOriginMutation =
    !['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.url.startsWith('/api/');
  const secured =
    token && sameOriginMutation
      ? request.clone({ setHeaders: { 'X-CSRF-TOKEN': token } })
      : request;
  return next(secured);
};
