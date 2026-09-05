import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../core/api/admin-api.service';
import { AdministratorAccountDto } from '../../../core/api/contracts';
import { SessionStore } from '../../../core/auth/session.store';
import { readApiError } from '../../../core/http/api-error';

@Component({
  selector: 'app-account-list',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>حساب‌های مدیریت</h1>
    <p class="lead">فقط مالک می‌تواند حساب مدیر ایجاد یا غیرفعال کند.</p>

    <table class="list">
      <thead><tr><th>نام</th><th>ایمیل</th><th>نقش</th><th>وضعیت</th><th></th></tr></thead>
      <tbody>
        @for (account of accounts(); track account.id) {
          <tr>
            <td>{{ account.displayName }}</td>
            <td class="mono">{{ account.email }}</td>
            <td>{{ account.isOwner ? 'مالک' : 'مدیر' }}</td>
            <td>{{ account.isActive ? 'فعال' : 'غیرفعال' }}</td>
            <td class="row-actions">
              @if (!account.isOwner && account.isActive && account.id !== currentAdminId()) {
                <button type="button" class="danger" (click)="deactivate(account)">غیرفعال‌کردن</button>
              }
              @if (!account.isOwner && account.isActive) {
                <button type="button" (click)="transfer(account)">انتقال مالکیت</button>
              }
            </td>
          </tr>
        }
      </tbody>
    </table>

    <section class="panel">
      <h2>افزودن مدیر جدید</h2>
      <form (submit)="create($event)">
        <div class="grid">
          <label>نام نمایشی<input required [(ngModel)]="form.displayName" name="displayName"></label>
          <label>ایمیل<input required type="email" [(ngModel)]="form.email" name="email" class="ltr"></label>
          <label>رمز عبور موقت<input required type="text" [(ngModel)]="form.temporaryPassword" name="temporaryPassword" class="ltr"></label>
        </div>
        <p class="hint">رمز باید حداقل ۱۲ نویسه شامل حرف بزرگ، کوچک، عدد و نویسه خاص باشد.</p>
        @if (errorMessage()) { <p class="error" role="alert">{{ errorMessage() }}</p> }
        <div class="form-actions"><button type="submit">ایجاد حساب</button></div>
      </form>
    </section>
  `,
  styles: [`
    :host{display:block;max-width:52rem}
    h1{margin:0 0 .3rem;font-size:1.6rem}
    h2{margin:0 0 1rem;font-size:1rem}
    .lead{margin:0 0 1.2rem;color:var(--color-text-muted);font-size:.85rem}
    table.list{width:100%;border-collapse:collapse;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);overflow:hidden;font-size:.85rem;margin-block-end:1.5rem}
    table.list th{text-align:start;padding:.6rem .8rem;color:var(--color-text-muted);font-weight:600;border-block-end:1px solid var(--color-border);font-size:.75rem}
    table.list td{padding:.6rem .8rem;border-block-end:1px solid var(--color-border)}
    .mono{direction:ltr;text-align:right;display:inline-block;font-family:monospace;color:var(--color-text-muted)}
    .row-actions{display:flex;gap:.4rem}
    .row-actions button{padding:.3rem .6rem;border:1px solid var(--color-border);border-radius:.4rem;background:transparent;color:var(--color-text);font-size:.75rem;cursor:pointer}
    .row-actions button.danger{color:var(--color-danger)}
    .panel{padding:1.2rem;border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface)}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.9rem;margin-block-end:.5rem}
    label{display:block;color:var(--color-text-muted);font-size:.78rem}
    input{display:block;width:100%;margin-block-start:.3rem;padding:.6rem;border:1px solid var(--color-border);border-radius:.5rem;background:var(--color-bg);color:var(--color-text)}
    input.ltr{direction:ltr;text-align:right;font-family:monospace}
    .hint{color:var(--color-text-muted);font-size:.75rem;margin-block-end:.6rem}
    .error{padding:.6rem .9rem;border-inline-start:2px solid var(--color-danger);background:rgb(255 154 171/8%);color:var(--color-danger);font-size:.8rem;border-radius:.4rem}
    .form-actions button{padding:.6rem 1.2rem;border:0;border-radius:999px;background:var(--color-primary);color:var(--color-primary-contrast);font-weight:700;cursor:pointer}
  `],
})
export class AccountListComponent {
  private readonly api = inject(AdminApiService);
  private readonly sessionStore = inject(SessionStore);

  protected readonly accounts = signal<ReadonlyArray<AdministratorAccountDto>>([]);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly currentAdminId = () => this.sessionStore.session()?.administratorId;
  protected form = { displayName: '', email: '', temporaryPassword: '' };

  constructor() {
    this.reload();
  }

  private reload(): void {
    this.api.accounts().subscribe((accounts) => this.accounts.set(accounts));
  }

  protected create(event: Event): void {
    event.preventDefault();
    this.api.createAccount(this.form).subscribe({
      next: () => { this.errorMessage.set(null); this.form = { displayName: '', email: '', temporaryPassword: '' }; this.reload(); },
      error: (error: unknown) => this.errorMessage.set(readApiError(error).title),
    });
  }

  protected deactivate(account: AdministratorAccountDto): void {
    if (!confirm(`حساب «${account.displayName}» غیرفعال شود؟`)) return;
    this.api.deactivateAccount(account.id).subscribe({
      next: () => this.reload(),
      error: (error: unknown) => this.errorMessage.set(readApiError(error).title),
    });
  }

  protected transfer(account: AdministratorAccountDto): void {
    if (!confirm(`مالکیت به «${account.displayName}» منتقل شود؟ پس از این کار، شما مدیر معمولی خواهید بود.`)) return;
    this.api.transferOwnership(account.id).subscribe({
      next: () => this.sessionStore.load().subscribe(() => this.reload()),
      error: (error: unknown) => this.errorMessage.set(readApiError(error).title),
    });
  }
}
