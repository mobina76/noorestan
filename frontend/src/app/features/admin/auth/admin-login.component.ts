import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SessionStore } from '../../../core/auth/session.store';
import { readApiError } from '../../../core/http/api-error';

@Component({
  selector: 'app-admin-login',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <header><span class="mark">N</span><div><h1>مدیریت نورستان</h1><p>ورود امن برای مدیران وب‌سایت</p></div></header>
      <form (submit)="submit($event)">
        <label>پست الکترونیک<input type="email" autocomplete="username" required [(ngModel)]="email" name="email" [disabled]="loading()"></label>
        <label>رمز عبور<input type="password" autocomplete="current-password" required [(ngModel)]="password" name="password" [disabled]="loading()"></label>
        @if (errorMessage()) { <p class="error" role="alert">{{ errorMessage() }}</p> }
        <button type="submit" [disabled]="loading()">{{ loading() ? 'در حال ورود…' : 'ورود به مدیریت' }}</button>
      </form>
      <a routerLink="/">بازگشت به وب‌سایت</a>
    </section>
  `,
  styles: [`
    :host{display:grid;place-items:center;min-height:75vh;padding:1rem}
    section{width:min(100% - 2rem,28rem);padding:2rem;border:1px solid var(--color-border);border-radius:var(--radius-lg);background:var(--color-surface);box-shadow:var(--shadow-surface)}
    header{display:flex;align-items:center;gap:1rem;margin-block-end:2rem}
    .mark{display:grid;place-items:center;width:3rem;height:3rem;border:1px solid var(--color-primary);border-radius:.8rem;color:var(--color-primary);box-shadow:var(--shadow-glow)}
    h1{margin:0;font-size:1.4rem}
    header p{margin:0;color:var(--color-text-muted);font-size:.75rem}
    label{display:block;margin-block:1rem;color:var(--color-text-muted);font-size:.8rem}
    input{display:block;width:100%;margin-block-start:.4rem;padding:.8rem;border:1px solid var(--color-border);border-radius:.6rem;background:var(--color-bg);color:var(--color-text)}
    button{width:100%;padding:.85rem;border:0;border-radius:999px;background:var(--color-primary);color:var(--color-primary-contrast);font-weight:800;cursor:pointer}
    button:disabled{opacity:.6;cursor:progress}
    section>a{display:block;margin-block-start:1.5rem;color:var(--color-text-muted);font-size:.75rem;text-align:center}
    .error{margin:0 0 1rem;padding:.7rem 1rem;border-inline-start:2px solid var(--color-danger);background:rgb(255 154 171/8%);color:var(--color-danger);font-size:.8rem;border-radius:.4rem}
  `],
})
export class AdminLoginComponent {
  private readonly sessionStore = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected email = '';
  protected password = '';
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected submit(event: Event): void {
    event.preventDefault();
    this.loading.set(true);
    this.errorMessage.set(null);
    this.sessionStore.login(this.email, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl && returnUrl.startsWith('/admin') ? returnUrl : '/admin');
      },
      error: (error: unknown) => {
        this.loading.set(false);
        const info = readApiError(error);
        this.errorMessage.set(info.status === 401 ? 'پست الکترونیک یا رمز عبور نادرست است.' : info.title);
      },
    });
  }
}
