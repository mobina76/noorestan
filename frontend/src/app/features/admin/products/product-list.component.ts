import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AdminApiService } from '../../../core/api/admin-api.service';
import { AdminProductSummary, ProductStatus } from '../../../core/api/contracts';
import { readApiError } from '../../../core/http/api-error';

const STATUS_TABS: ReadonlyArray<{ readonly value: ProductStatus | null; readonly label: string }> =
  [
    { value: null, label: 'همه' },
    { value: 'Published', label: 'منتشرشده' },
    { value: 'Draft', label: 'پیش‌نویس' },
    { value: 'Hidden', label: 'پنهان' },
    { value: 'Archived', label: 'بایگانی‌شده' },
  ];

@Component({
  selector: 'app-product-list',
  imports: [RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="head">
      <div>
        <h1>محصولات</h1>
        <p class="lead">فهرست محصولات کاتالوگ و وضعیت انتشار آن‌ها.</p>
      </div>
      <a routerLink="/admin/products/new" class="primary">+ محصول جدید</a>
    </div>

    <div class="toolbar">
      <div class="tabs">
        @for (tab of statusTabs; track tab.label) {
          <button
            type="button"
            [class.active]="status() === tab.value"
            (click)="setStatus(tab.value)"
          >
            {{ tab.label }}
          </button>
        }
      </div>
      <div class="search">
        <input
          type="search"
          placeholder="جست‌وجوی نام یا کد محصول"
          [value]="query()"
          (input)="setQuery($event)"
        />
      </div>
    </div>

    @if (errorMessage()) {
      <p class="error" role="alert">{{ errorMessage() }}</p>
    }

    <table class="list">
      <thead>
        <tr>
          <th></th>
          <th>نام</th>
          <th>دسته‌بندی</th>
          <th>وضعیت</th>
          <th>به‌روزرسانی</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        @for (product of products(); track product.id) {
          <tr>
            <td class="thumb-cell">
              @if (product.primaryImageUrl) {
                <img [src]="product.primaryImageUrl" alt="" width="40" height="40" />
              } @else {
                <span class="no-image">—</span>
              }
            </td>
            <td>
              <a [routerLink]="['/admin/products', product.id]">{{ product.nameFa }}</a
              ><br /><span class="mono">{{ product.mazinoorProductCode }}</span>
            </td>
            <td>{{ product.categoryNameFa }}</td>
            <td>
              <span class="status" [attr.data-status]="product.status">{{
                statusLabel(product.status)
              }}</span>
            </td>
            <td class="muted">{{ product.updatedAt | date: 'yyyy/MM/dd HH:mm' }}</td>
            <td class="row-actions">
              @if (product.status === 'Draft' || product.status === 'Hidden') {
                <button type="button" (click)="changeStatus(product, 'Published')">انتشار</button>
              }
              @if (product.status === 'Published') {
                <button type="button" (click)="changeStatus(product, 'Hidden')">پنهان‌کردن</button>
              }
              @if (product.status !== 'Archived') {
                <button type="button" class="danger" (click)="changeStatus(product, 'Archived')">
                  بایگانی
                </button>
              }
              @if (product.status === 'Archived') {
                <button type="button" (click)="changeStatus(product, 'Draft')">بازگردانی</button>
              }
            </td>
          </tr>
        } @empty {
          <tr>
            <td colspan="6">محصولی با این شرایط یافت نشد.</td>
          </tr>
        }
      </tbody>
    </table>

    @if (total() > pageSize) {
      <div class="pager">
        <button type="button" (click)="setPage(page() - 1)" [disabled]="page() <= 1">قبلی</button>
        <span>صفحه {{ page() }} از {{ totalPages() }}</span>
        <button type="button" (click)="setPage(page() + 1)" [disabled]="page() >= totalPages()">
          بعدی
        </button>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 68rem;
      }
      .head {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 1rem;
        margin-block-end: 1.2rem;
        flex-wrap: wrap;
      }
      h1 {
        margin: 0 0 0.3rem;
        font-size: 1.6rem;
      }
      .lead {
        margin: 0;
        color: var(--color-text-muted);
        font-size: 0.85rem;
      }
      .head .primary {
        padding: 0.6rem 1.1rem;
        border: 0;
        border-radius: 999px;
        background: var(--color-primary);
        color: var(--color-primary-contrast);
        text-decoration: none;
        font-weight: 700;
        font-size: 0.85rem;
      }
      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-block-end: 1rem;
        flex-wrap: wrap;
      }
      .tabs {
        display: flex;
        gap: 0.3rem;
        flex-wrap: wrap;
      }
      .tabs button {
        padding: 0.45rem 0.9rem;
        border: 1px solid var(--color-border);
        border-radius: 999px;
        background: transparent;
        color: var(--color-text-muted);
        font-size: 0.8rem;
        cursor: pointer;
      }
      .tabs button.active {
        border-color: var(--color-primary);
        color: var(--color-text);
        background: rgb(139 212 255/8%);
      }
      .search input {
        padding: 0.5rem 0.8rem;
        border: 1px solid var(--color-border);
        border-radius: 0.6rem;
        background: var(--color-bg);
        color: var(--color-text);
        min-width: 16rem;
      }
      table.list {
        width: 100%;
        border-collapse: collapse;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        overflow: hidden;
        font-size: 0.83rem;
      }
      table.list th {
        text-align: start;
        padding: 0.6rem 0.7rem;
        color: var(--color-text-muted);
        font-weight: 600;
        border-block-end: 1px solid var(--color-border);
        font-size: 0.72rem;
      }
      table.list td {
        padding: 0.55rem 0.7rem;
        border-block-end: 1px solid var(--color-border);
        vertical-align: middle;
      }
      table.list a {
        color: var(--color-text);
        text-decoration: none;
        font-weight: 600;
      }
      .thumb-cell img {
        border-radius: 0.4rem;
        object-fit: cover;
      }
      .no-image {
        color: var(--color-text-muted);
      }
      .mono {
        direction: ltr;
        display: inline-block;
        font-family: monospace;
        color: var(--color-text-muted);
        font-size: 0.72rem;
      }
      .muted {
        color: var(--color-text-muted);
        font-size: 0.78rem;
      }
      .status {
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        font-size: 0.72rem;
        border: 1px solid var(--color-border);
        color: var(--color-text-muted);
      }
      .status[data-status='Published'] {
        color: var(--color-success);
        border-color: color-mix(in srgb, var(--color-success) 45%, var(--color-border));
      }
      .status[data-status='Archived'] {
        color: var(--color-danger);
        border-color: color-mix(in srgb, var(--color-danger) 45%, var(--color-border));
      }
      .row-actions {
        display: flex;
        gap: 0.35rem;
        flex-wrap: wrap;
        white-space: nowrap;
      }
      .row-actions button {
        padding: 0.3rem 0.55rem;
        border: 1px solid var(--color-border);
        border-radius: 0.4rem;
        background: transparent;
        color: var(--color-text);
        font-size: 0.72rem;
        cursor: pointer;
      }
      .row-actions button.danger {
        color: var(--color-danger);
      }
      .pager {
        display: flex;
        align-items: center;
        gap: 1rem;
        justify-content: center;
        margin-block-start: 1.2rem;
        color: var(--color-text-muted);
        font-size: 0.82rem;
      }
      .pager button {
        padding: 0.4rem 0.9rem;
        border: 1px solid var(--color-border);
        border-radius: 0.5rem;
        background: transparent;
        color: var(--color-text);
        cursor: pointer;
      }
      .pager button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .error {
        padding: 0.6rem 0.9rem;
        border-inline-start: 2px solid var(--color-danger);
        background: rgb(255 154 171/8%);
        color: var(--color-danger);
        font-size: 0.8rem;
        border-radius: 0.4rem;
        margin-block-end: 1rem;
      }
    `,
  ],
})
export class ProductListComponent {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  protected readonly statusTabs = STATUS_TABS;
  protected readonly pageSize = 20;

  protected readonly status = signal<ProductStatus | null>(null);
  protected readonly query = signal('');
  protected readonly page = signal(1);
  protected readonly products = signal<ReadonlyArray<AdminProductSummary>>([]);
  protected readonly total = signal(0);
  protected readonly errorMessage = signal<string | null>(null);

  private searchDebounce?: ReturnType<typeof setTimeout>;

  constructor() {
    const initialStatus = this.route.snapshot.queryParamMap.get('status') as ProductStatus | null;
    if (initialStatus) this.status.set(initialStatus);
    this.reload();
  }

  protected totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / this.pageSize));
  }

  protected statusLabel(status: ProductStatus): string {
    return this.statusTabs.find((t) => t.value === status)?.label ?? status;
  }

  protected setStatus(status: ProductStatus | null): void {
    this.status.set(status);
    this.page.set(1);
    this.reload();
  }

  protected setQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.page.set(1);
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.reload(), 300);
  }

  protected setPage(page: number): void {
    this.page.set(page);
    this.reload();
  }

  protected changeStatus(product: AdminProductSummary, target: ProductStatus): void {
    if (
      target === 'Archived' &&
      !confirm(`محصول «${product.nameFa}» بایگانی شود؟ این محصول از وب‌سایت عمومی حذف می‌شود.`)
    )
      return;
    this.api.changeStatus(product.id, target, product.version).subscribe({
      next: () => {
        this.errorMessage.set(null);
        this.reload();
      },
      error: (error: unknown) => this.errorMessage.set(readApiError(error).title),
    });
  }

  private reload(): void {
    this.api
      .products({
        status: this.status() ?? undefined,
        q: this.query() || undefined,
        page: this.page(),
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (result) => {
          this.products.set(result.items);
          this.total.set(result.total);
        },
        error: (error: unknown) => this.errorMessage.set(readApiError(error).title),
      });
  }
}
