import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, of, switchMap, tap } from 'rxjs';

export interface AdminSession {
  readonly administratorId: string;
  readonly displayName: string;
  readonly isOwner: boolean;
  readonly csrfToken: string;
}

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly http = inject(HttpClient);
  readonly session = signal<AdminSession | null>(null);
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly isOwner = computed(() => this.session()?.isOwner === true);
  load() {
    return this.http.get<AdminSession>('/api/v1/auth/session').pipe(
      tap((value) => this.session.set(value)),
      catchError(() => {
        this.session.set(null);
        return of(null);
      }),
    );
  }
  login(email: string, password: string) {
    return this.http
      .post<void>('/api/v1/auth/login', { email, password })
      .pipe(switchMap(() => this.load()));
  }
  logout() {
    return this.http.post<void>('/api/v1/auth/logout', {}).pipe(tap(() => this.session.set(null)));
  }
}
