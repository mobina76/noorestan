import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminApiService } from '../../../core/api/admin-api.service';
import { ProductStatus } from '../../../core/api/contracts';

interface DashboardStats {
  readonly draft: number;
  readonly published: number;
  readonly hidden: number;
  readonly archived: number;
  readonly categories: number;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>داشبورد</h1>
    <p class="lead">وضعیت کلی کاتالوگ نورستان را از این‌جا ببینید.</p>
    @if (stats(); as s) {
      <div class="cards">
        <a routerLink="/admin/products" [queryParams]="{ status: 'Published' }" class="card"><span>{{ s.published }}</span><b>منتشرشده</b></a>
        <a routerLink="/admin/products" [queryParams]="{ status: 'Draft' }" class="card"><span>{{ s.draft }}</span><b>پیش‌نویس</b></a>
        <a routerLink="/admin/products" [queryParams]="{ status: 'Hidden' }" class="card"><span>{{ s.hidden }}</span><b>پنهان</b></a>
        <a routerLink="/admin/products" [queryParams]="{ status: 'Archived' }" class="card"><span>{{ s.archived }}</span><b>بایگانی‌شده</b></a>
        <a routerLink="/admin/categories" class="card"><span>{{ s.categories }}</span><b>دسته‌بندی</b></a>
      </div>
    } @else {
      <p>در حال بارگذاری آمار…</p>
    }
    <div class="actions">
      <a routerLink="/admin/products/new" class="primary">افزودن محصول جدید ←</a>
      <a routerLink="/admin/categories">مدیریت دسته‌بندی‌ها ←</a>
      <a routerLink="/admin/content">ویرایش محتوای سایت ←</a>
    </div>
  `,
  styles: [`
    :host{display:block;max-width:60rem}
    h1{margin:0 0 .3rem;font-size:1.6rem}
    .lead{margin:0 0 1.5rem;color:var(--color-text-muted);font-size:.85rem}
    .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(9rem,1fr));gap:.8rem;margin-block-end:2rem}
    .card{display:flex;flex-direction:column;gap:.3rem;padding:1.1rem;border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface);color:var(--color-text);text-decoration:none}
    .card:hover{border-color:var(--color-primary)}
    .card span{font-size:1.7rem;font-weight:800}
    .card b{color:var(--color-text-muted);font-size:.78rem;font-weight:500}
    .actions{display:flex;flex-wrap:wrap;gap:.8rem}
    .actions a{padding:.7rem 1.1rem;border:1px solid var(--color-border);border-radius:999px;color:var(--color-text);text-decoration:none;font-size:.85rem}
    .actions .primary{border-color:var(--color-primary);background:var(--color-primary);color:var(--color-primary-contrast)}
  `],
})
export class AdminDashboardComponent {
  private readonly api = inject(AdminApiService);
  protected readonly stats = signal<DashboardStats | null>(null);

  constructor() {
    const byStatus = (status: ProductStatus) => this.api.products({ status, pageSize: 1 });
    forkJoin({
      draft: byStatus('Draft'),
      published: byStatus('Published'),
      hidden: byStatus('Hidden'),
      archived: byStatus('Archived'),
      categories: this.api.categories(),
    }).subscribe((result) => {
      this.stats.set({
        draft: result.draft.total,
        published: result.published.total,
        hidden: result.hidden.total,
        archived: result.archived.total,
        categories: result.categories.length,
      });
    });
  }
}
