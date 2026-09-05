import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { SessionStore } from './session.store';

export const adminGuard: CanActivateFn = () => {
  const sessionStore = inject(SessionStore);
  const router = inject(Router);

  if (sessionStore.session() !== null) return true;

  return sessionStore.load().pipe(
    map((session) => (session !== null ? true : router.createUrlTree(['/admin/login']))),
    catchError(() => of(router.createUrlTree(['/admin/login']))),
  );
};

export const ownerGuard: CanActivateFn = (route, state) => {
  const sessionStore = inject(SessionStore);
  const router = inject(Router);
  if (sessionStore.isOwner()) return true;
  if (sessionStore.session() !== null) return router.createUrlTree(['/admin']);
  return adminGuard(route, state);
};
