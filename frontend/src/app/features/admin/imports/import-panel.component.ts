import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../../core/api/admin-api.service';
import { AdminCategory, ImportItemDto, ImportRunDto } from '../../../core/api/contracts';
import { readApiError } from '../../../core/http/api-error';

@Component({
  selector: 'app-import-panel',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>دریافت محصول از مازی‌نور</h1>
    <p class="lead">
      نشانی صفحه هر محصول را از سایت رسمی mazinoor.com وارد کنید (هر خط یک نشانی). ابتدا حالت
      آزمایشی را اجرا کنید؛ محصولات جدید به‌صورت پیش‌نویس ایجاد می‌شوند و پیش از انتشار قابل بازبینی
      هستند.
    </p>

    <form class="panel" (submit)="startImport($event, 'DryRun')">
      <label
        >دسته‌بندی مقصد
        <select required [(ngModel)]="categoryId" name="categoryId">
          <option value="" disabled>انتخاب کنید</option>
          @for (category of categories(); track category.id) {
            <option [value]="category.id">{{ category.nameFa }}</option>
          }
        </select>
      </label>
      <label
        >نشانی‌های محصول (هر خط یک نشانی، حداکثر ۳۰ مورد)
        <textarea
          rows="5"
          [(ngModel)]="urlsText"
          name="urlsText"
          placeholder="https://www.mazinoor.com/luminaires/..."
        ></textarea>
      </label>
      @if (errorMessage()) {
        <p class="error" role="alert">{{ errorMessage() }}</p>
      }
      <div class="form-actions">
        <button type="submit" [disabled]="running()">اجرای آزمایشی (Dry Run)</button>
        <button type="button" [disabled]="running()" (click)="startImport(undefined, 'Commit')">
          اجرا و ثبت محصولات
        </button>
      </div>
    </form>

    @if (lastRun(); as run) {
      <section class="panel">
        <h2>نتیجه آخرین اجرا — {{ run.mode === 'DryRun' ? 'آزمایشی' : 'ثبت شده' }}</h2>
        <p class="muted">وضعیت: {{ statusLabel(run.status) }} — {{ summaryText(run) }}</p>
        <table class="list">
          <thead>
            <tr>
              <th>نشانی منبع</th>
              <th>کد محصول</th>
              <th>نتیجه</th>
              <th>پیام</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.id) {
              <tr>
                <td class="mono">{{ item.canonicalSourceUrl }}</td>
                <td class="mono">{{ item.mazinoorProductCode }}</td>
                <td>{{ outcomeLabel(item.outcome) }}</td>
                <td class="muted">{{ firstMessage(item) }}</td>
                <td>
                  @if (item.productId) {
                    <a [routerLink]="['/admin/products', item.productId]">مشاهده</a>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 60rem;
      }
      h1 {
        margin: 0 0 0.3rem;
        font-size: 1.6rem;
      }
      h2 {
        margin: 0 0 0.6rem;
        font-size: 1rem;
      }
      .lead {
        margin: 0 0 1.2rem;
        color: var(--color-text-muted);
        font-size: 0.85rem;
        max-width: 44rem;
      }
      .panel {
        margin-block-end: 1.2rem;
        padding: 1.2rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-surface);
      }
      label {
        display: block;
        color: var(--color-text-muted);
        font-size: 0.78rem;
        margin-block-end: 0.9rem;
      }
      select,
      textarea {
        display: block;
        width: 100%;
        margin-block-start: 0.3rem;
        padding: 0.6rem;
        border: 1px solid var(--color-border);
        border-radius: 0.5rem;
        background: var(--color-bg);
        color: var(--color-text);
        font-family: inherit;
      }
      textarea {
        direction: ltr;
        text-align: right;
        font-family: monospace;
        font-size: 0.8rem;
      }
      .form-actions {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
      }
      .form-actions button {
        padding: 0.6rem 1.1rem;
        border: 1px solid var(--color-border);
        border-radius: 999px;
        background: transparent;
        color: var(--color-text);
        cursor: pointer;
        font-size: 0.82rem;
      }
      .form-actions button:first-child {
        border: 0;
        background: var(--color-primary);
        color: var(--color-primary-contrast);
        font-weight: 700;
      }
      .error {
        padding: 0.6rem 0.9rem;
        border-inline-start: 2px solid var(--color-danger);
        background: rgb(255 154 171/8%);
        color: var(--color-danger);
        font-size: 0.8rem;
        border-radius: 0.4rem;
        margin-block-end: 0.8rem;
      }
      .muted {
        color: var(--color-text-muted);
        font-size: 0.82rem;
      }
      table.list {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.8rem;
        margin-block-start: 0.8rem;
      }
      table.list th {
        text-align: start;
        padding: 0.5rem 0.6rem;
        color: var(--color-text-muted);
        font-weight: 600;
        border-block-end: 1px solid var(--color-border);
        font-size: 0.7rem;
      }
      table.list td {
        padding: 0.5rem 0.6rem;
        border-block-end: 1px solid var(--color-border);
      }
      .mono {
        direction: ltr;
        text-align: right;
        display: inline-block;
        font-family: monospace;
        font-size: 0.72rem;
        color: var(--color-text-muted);
        word-break: break-all;
      }
      table.list a {
        color: var(--color-primary);
        text-decoration: none;
      }
    `,
  ],
})
export class ImportPanelComponent {
  private readonly api = inject(AdminApiService);

  protected readonly categories = signal<ReadonlyArray<AdminCategory>>([]);
  protected readonly running = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly lastRun = signal<ImportRunDto | null>(null);
  protected readonly items = signal<ReadonlyArray<ImportItemDto>>([]);

  protected categoryId = '';
  protected urlsText = '';

  constructor() {
    this.api.categories().subscribe((categories) => this.categories.set(categories));
  }

  protected statusLabel(status: ImportRunDto['status']): string {
    return {
      Queued: 'در صف',
      Running: 'در حال اجرا',
      Completed: 'تکمیل شد',
      CompletedWithWarnings: 'تکمیل با هشدار',
      Failed: 'ناموفق',
      Cancelled: 'لغوشده',
    }[status];
  }

  protected outcomeLabel(outcome: ImportItemDto['outcome']): string {
    return {
      New: 'جدید',
      Unchanged: 'بدون تغییر',
      Updated: 'به‌روزشد',
      Skipped: 'نادیده گرفته شد',
      Invalid: 'نامعتبر',
      Failed: 'ناموفق',
    }[outcome];
  }

  protected summaryText(run: ImportRunDto): string {
    try {
      const summary = JSON.parse(run.summaryJson) as {
        new: number;
        unchanged: number;
        invalid: number;
        failed: number;
      };
      return `جدید: ${summary.new} — بدون تغییر: ${summary.unchanged} — نامعتبر: ${summary.invalid} — ناموفق: ${summary.failed}`;
    } catch {
      return '';
    }
  }

  protected firstMessage(item: ImportItemDto): string {
    try {
      const messages = JSON.parse(item.messagesJson) as string[];
      return messages[0] ?? '';
    } catch {
      return '';
    }
  }

  protected startImport(event: Event | undefined, mode: 'DryRun' | 'Commit'): void {
    event?.preventDefault();
    const urls = this.urlsText
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);
    if (!this.categoryId || urls.length === 0) {
      this.errorMessage.set('دسته‌بندی و حداقل یک نشانی محصول الزامی است.');
      return;
    }
    this.running.set(true);
    this.errorMessage.set(null);
    this.api.startImport(this.categoryId, urls, mode).subscribe({
      next: (run) => {
        this.running.set(false);
        this.lastRun.set(run);
        this.api.importItems(run.id).subscribe((items) => this.items.set(items));
      },
      error: (error: unknown) => {
        this.running.set(false);
        this.errorMessage.set(readApiError(error).title);
      },
    });
  }
}
