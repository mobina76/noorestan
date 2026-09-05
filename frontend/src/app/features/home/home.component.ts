import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicApiService } from '../../core/api/public-api.service';
import { CategorySummary, PublicProductSummary } from '../../core/api/contracts';
import { SiteStore } from '../../core/site/site.store';
import { ProductCardComponent } from '../../shared/product-card.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProductCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero">
      <div class="hero-grid">
        <div class="hero-copy">
          <span class="eyebrow"><i></i> {{ site.site().representativeStatementFa }}</span>
          <h1>روشنایی حرفه‌ای،<br /><em>انتخابی مطمئن.</em></h1>
          <p>
            {{ site.site().businessNameFa }} با شناخت فنی محصولات مازی‌نور، شما را برای انتخاب
            راهکار روشنایی مناسب پروژه همراهی می‌کند.
          </p>
          <div class="actions">
            <a class="primary" routerLink="/products">مشاهده محصولات <span>←</span></a>
            <a class="secondary" routerLink="/contact">تماس با نورستان</a>
          </div>
        </div>
        <div class="hero-visual">
          @if (heroImage(); as image) {
            <img [src]="image.url" [alt]="image.altTextFa" width="640" height="560" />
          }
          <div class="hero-glow" aria-hidden="true"></div>
        </div>
      </div>
    </section>

    @if (categories().length) {
      <section id="categories" class="section">
        <div class="heading">
          <div>
            <span class="eyebrow">دسته‌بندی محصولات</span>
            <h2>راهکار روشنایی برای هر فضا</h2>
          </div>
          <a routerLink="/products">همه محصولات ←</a>
        </div>
        <div class="category-grid">
          @for (category of categories(); track category.slug) {
            <a
              [routerLink]="['/products']"
              [queryParams]="{ category: category.slug }"
              class="category"
            >
              <h3>{{ category.nameFa }}</h3>
              <small>{{ category.productCount }} محصول</small>
            </a>
          }
        </div>
      </section>
    }

    @if (featured().length) {
      <section class="section featured">
        <div class="heading">
          <div>
            <span class="eyebrow">منتخب نورستان</span>
            <h2>محصولات شاخص</h2>
          </div>
        </div>
        <div class="product-grid">
          @for (product of featured(); track product.id; let first = $first) {
            <app-product-card [product]="product" [priority]="first" />
          }
        </div>
      </section>
    }

    <section class="section why">
      <div class="why-copy">
        <span class="eyebrow">چرا نورستان؟</span>
        <h2>از انتخاب محصول تا روشن‌شدن فضا</h2>
        <div class="reasons">
          <article>
            <b>۰۱</b>
            <h3>مشاوره فنی</h3>
            <p>انتخاب آگاهانه بر پایه کاربرد، نور و مشخصات پروژه.</p>
          </article>
          <article>
            <b>۰۲</b>
            <h3>محصولات معتبر</h3>
            <p>دسترسی به سبد حرفه‌ای محصولات روشنایی مازی‌نور.</p>
          </article>
          <article>
            <b>۰۳</b>
            <h3>پاسخ‌گویی مستقیم</h3>
            <p>استعلام قیمت، موجودی و سفارش از مسیر ارتباطی روشن.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="contact-band">
      <div>
        <span class="eyebrow">شروع یک گفت‌وگوی روشن</span>
        <h2>برای پروژه بعدی کنار شما هستیم.</h2>
      </div>
      <div>
        <p>
          برای دریافت مشاوره، استعلام قیمت و بررسی موجودی محصولات با
          {{ site.site().businessNameFa }} تماس بگیرید.
        </p>
        <a routerLink="/contact">تماس با نورستان <span>←</span></a>
      </div>
    </section>
  `,
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private readonly api = inject(PublicApiService);
  protected readonly site = inject(SiteStore);

  protected readonly categories = signal<ReadonlyArray<CategorySummary>>([]);
  protected readonly featured = signal<ReadonlyArray<PublicProductSummary>>([]);
  protected readonly heroImage = computed(() => this.featured()[0]?.primaryImage);

  constructor() {
    this.site.load().subscribe();
    this.api.categories().subscribe((categories) => this.categories.set(categories));
    this.api.products({ pageSize: 3 }).subscribe((page) => this.featured.set(page.items));
  }
}
