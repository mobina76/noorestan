import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PublicApiService } from '../../core/api/public-api.service';
import { CategorySummary, PublicProductSummary } from '../../core/api/contracts';
import { ProductCardComponent } from '../../shared/product-card.component';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-catalog',
  imports: [ProductCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<header class="page-head"><span>کاتالوگ محصولات</span><h1>محصولات نورستان</h1><p>در میان محصولات مازی‌نور جست‌وجو کنید و برای انتخاب، قیمت و موجودی با نورستان تماس بگیرید.</p></header>
<section class="catalog">
  <aside>
    <label for="search">جست‌وجوی محصول</label>
    <div class="search"><input id="search" type="search" [value]="query()" (input)="setQuery($event)" placeholder="نام یا کد محصول"><span>⌕</span></div>
    <fieldset>
      <legend>دسته‌بندی</legend>
      <button type="button" [class.active]="category() === null" (click)="setCategory(null)">همه محصولات</button>
      @for (item of categories(); track item.slug) {
        <button type="button" [class.active]="category() === item.slug" (click)="setCategory(item.slug)">{{ item.nameFa }} <small>({{ item.productCount }})</small></button>
      }
    </fieldset>
    <div class="help"><span>محصول مناسب را پیدا نکردید؟</span><a href="/contact">از ما بپرسید ←</a></div>
  </aside>
  <div>
    <div class="result-head"><p><b>{{ total() }}</b> محصول</p></div>
    <div class="grid">
      @for (product of products(); track product.id) { <app-product-card [product]="product" /> }
      @empty {
        @if (!loading()) {
          <div class="empty"><h2>نتیجه‌ای پیدا نشد</h2><p>عبارت جست‌وجو یا دسته‌بندی را تغییر دهید.</p><button type="button" (click)="reset()">پاک‌کردن فیلترها</button></div>
        }
      }
    </div>
    @if (totalPages() > 1) {
      <div class="pager">
        <button type="button" (click)="setPage(page() - 1)" [disabled]="page() <= 1">قبلی</button>
        <span>صفحه {{ page() }} از {{ totalPages() }}</span>
        <button type="button" (click)="setPage(page() + 1)" [disabled]="page() >= totalPages()">بعدی</button>
      </div>
    }
  </div>
</section>
`,
  styles: [`
.page-head{max-width:78rem;margin:auto;padding:2.5rem clamp(1rem,4vw,2.5rem) 2rem}
.page-head>span{color:var(--color-primary);font-size:.75rem}
.page-head h1{margin:.5rem 0 .6rem;font-size:clamp(1.9rem,3.4vw,2.6rem);line-height:1.15;letter-spacing:-.03em}
.page-head p{max-width:38rem;color:var(--color-text-muted);font-size:.92rem}
.catalog{display:grid;grid-template-columns:15rem 1fr;gap:2rem;max-width:78rem;margin:auto;padding:0 clamp(1rem,4vw,2.5rem) var(--space-section)}
aside{position:sticky;inset-block-start:5.5rem;align-self:start}
label,legend{display:block;margin-block-end:.6rem;color:var(--color-text-muted);font-size:.75rem}
.search{display:flex;border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface)}
.search input{min-width:0;width:100%;padding:.65rem .8rem;border:0;outline:0;background:transparent;color:var(--color-text)}
.search span{padding:.65rem;color:var(--color-primary)}
fieldset{display:flex;flex-direction:column;gap:.2rem;margin:1.4rem 0;padding:0;border:0}
fieldset button{padding:.5rem .7rem;border:0;border-inline-start:2px solid transparent;background:transparent;color:var(--color-text-muted);text-align:start;font-size:.85rem;cursor:pointer}
fieldset button small{color:inherit;opacity:.7}
fieldset button:hover,fieldset button.active{border-color:var(--color-primary);background:rgb(139 212 255/6%);color:var(--color-text)}
.help{padding:.9rem;border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface);font-size:.75rem}
.help span{display:block;color:var(--color-text-muted)}
.help a{color:var(--color-primary);text-decoration:none}
.result-head{display:flex;justify-content:space-between;align-items:center;margin-block-end:1rem;color:var(--color-text-muted);font-size:.75rem}
.result-head b{color:var(--color-text);font-size:1rem}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}
.empty{grid-column:1/-1;padding:3.5rem 2rem;border:1px dashed var(--color-border);border-radius:var(--radius-lg);text-align:center}
.empty p{color:var(--color-text-muted)}
.empty button{padding:.6rem .9rem;border:1px solid var(--color-primary);border-radius:999px;background:transparent;color:var(--color-primary);cursor:pointer}
.pager{display:flex;align-items:center;gap:1rem;justify-content:center;margin-block-start:1.5rem;color:var(--color-text-muted);font-size:.85rem}
.pager button{padding:.5rem 1rem;border:1px solid var(--color-border);border-radius:.6rem;background:transparent;color:var(--color-text);cursor:pointer}
.pager button:disabled{opacity:.4;cursor:not-allowed}
@media(max-width:64rem){.catalog{grid-template-columns:1fr}aside{position:static}fieldset{display:grid;grid-template-columns:repeat(2,1fr)}.grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:32rem){.grid{grid-template-columns:1fr}}
`],
})
export class CatalogComponent {
  private readonly api = inject(PublicApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly categories = signal<ReadonlyArray<CategorySummary>>([]);
  protected readonly products = signal<ReadonlyArray<PublicProductSummary>>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(true);

  protected readonly query = signal('');
  protected readonly category = signal<string | null>(null);
  protected readonly page = signal(1);

  private searchDebounce?: ReturnType<typeof setTimeout>;

  constructor() {
    this.api.categories().subscribe((categories) => this.categories.set(categories));
    const params = this.route.snapshot.queryParamMap;
    this.query.set(params.get('q') ?? '');
    this.category.set(params.get('category'));
    this.page.set(Number(params.get('page') ?? '1') || 1);
    this.reload();
  }

  protected totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / PAGE_SIZE));
  }

  protected setQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.page.set(1);
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => { this.reload(); this.syncUrl(); }, 300);
  }

  protected setCategory(slug: string | null): void {
    this.category.set(slug);
    this.page.set(1);
    this.reload();
    this.syncUrl();
  }

  protected setPage(page: number): void {
    this.page.set(page);
    this.reload();
    this.syncUrl();
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected reset(): void {
    this.query.set('');
    this.category.set(null);
    this.page.set(1);
    this.reload();
    this.syncUrl();
  }

  private syncUrl(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: this.query() || null, category: this.category(), page: this.page() > 1 ? this.page() : null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private reload(): void {
    this.loading.set(true);
    this.api.products({ q: this.query() || undefined, category: this.category() ?? undefined, page: this.page(), pageSize: PAGE_SIZE }).subscribe((result) => {
      this.products.set(result.items);
      this.total.set(result.total);
      this.loading.set(false);
    });
  }
}
