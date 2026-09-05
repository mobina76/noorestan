import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicApiService } from '../../core/api/public-api.service';
import { CategorySummary, PublicProductSummary } from '../../core/api/contracts';
import { SiteStore } from '../../core/site/site.store';
import { ProductCardComponent } from '../../shared/product-card.component';

// Placeholder photography only: real architectural/lighting photos, downloaded and re-encoded as
// WebP so the page doesn't depend on a third-party image host. Swap the files under
// `public/placeholders/` for the client's own project photography when it is supplied — nothing
// else needs to change.
const HERO_IMAGES = [
  '/placeholders/hero-1.webp',
  '/placeholders/hero-2.webp',
  '/placeholders/hero-3.webp',
];
const CATEGORY_IMAGES = [
  '/placeholders/category-1.webp',
  '/placeholders/category-2.webp',
  '/placeholders/category-3.webp',
  '/placeholders/category-4.webp',
  '/placeholders/category-5.webp',
];
const MID_CTA_IMAGE = '/placeholders/mid-cta.webp';

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
function toFa(value: number): string {
  return String(value)
    .split('')
    .map((digit) => PERSIAN_DIGITS[Number(digit)] ?? digit)
    .join('');
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProductCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero">
      <div class="hero-slides" aria-hidden="true">
        @for (slide of heroSlides; track slide; let i = $index) {
          <img
            class="hero-slide"
            [class.active]="activeSlide() === i"
            [src]="slide"
            alt=""
            width="1280"
            height="853"
            [attr.loading]="i === 0 ? 'eager' : 'lazy'"
            [attr.fetchpriority]="i === 0 ? 'high' : 'auto'"
          />
        }
      </div>
      <span class="hero-scrim" aria-hidden="true"></span>
      <div class="hero-content">
        <span class="partner-badge">
          <img src="/brand/mazinoor-logo-white.svg" alt="مازی‌نور" width="88" height="38" />
          <span>{{ site.site().representativeStatementFa }}</span>
        </span>
        <h1><span class="line1">نور،</span> <span class="line2">زبان معماری فضای شماست.</span></h1>
        <p>
          {{ site.site().businessNameFa }} با شناخت فنی محصولات مازی‌نور، شما را در انتخاب و اجرای
          روشنایی حرفه‌ای فضای خود همراهی می‌کند.
        </p>
        <div class="actions">
          <a class="primary" routerLink="/products"
            >مشاهده محصولات <span aria-hidden="true">←</span></a
          >
          <a class="outline" routerLink="/contact">تماس با ما</a>
        </div>
        <ul class="trust-badges">
          <li><i aria-hidden="true">✓</i>همراهی و مشاوره تخصصی</li>
          <li><i aria-hidden="true">✓</i>دسترسی به محصولات مازی‌نور</li>
          <li><i aria-hidden="true">✓</i>تضمین اصالت محصولات</li>
        </ul>
      </div>
      <div class="hero-nav" role="tablist" aria-label="انتخاب تصویر پس‌زمینه">
        @for (slide of heroSlides; track slide; let i = $index) {
          <button
            type="button"
            role="tab"
            class="hero-dot"
            [class.active]="activeSlide() === i"
            [attr.aria-selected]="activeSlide() === i"
            [attr.aria-label]="'تصویر ' + toFa(i + 1) + ' از ' + toFa(heroSlides.length)"
            (click)="setSlide(i)"
          ></button>
        }
        <span class="hero-counter" aria-hidden="true"
          >{{ toFa(activeSlide() + 1) }} / {{ toFa(heroSlides.length) }}</span
        >
      </div>
    </section>

    @if (categories().length) {
      <section class="section categories-section" aria-labelledby="categories-heading">
        <div class="heading">
          <div>
            <span class="eyebrow">دسته‌بندی محصولات</span>
            <h2 id="categories-heading">برای هر فضا، یک نور حرفه‌ای</h2>
          </div>
          <a routerLink="/products">همه محصولات ←</a>
        </div>
        <div class="category-row">
          @for (category of categories(); track category.slug; let i = $index) {
            <a
              [routerLink]="['/products']"
              [queryParams]="{ category: category.slug }"
              class="category-card"
              [style.background-image]="'url(' + categoryImage(i) + ')'"
            >
              <span class="category-card-overlay" aria-hidden="true"></span>
              <span class="category-card-body">
                <span class="category-name">{{ category.nameFa }}</span>
                <span class="category-count">{{ category.productCount }} محصول</span>
              </span>
              <span class="category-arrow" aria-hidden="true">←</span>
            </a>
          }
        </div>
      </section>
    }

    @if (featured().length) {
      <section class="section featured-section">
        <div class="heading">
          <div>
            <span class="eyebrow">منتخب نورستان</span>
            <h2>محبوب‌ترین محصولات</h2>
          </div>
        </div>
        <div class="featured-row">
          @for (product of featured(); track product.id; let first = $first) {
            <app-product-card [product]="product" [priority]="first" [compact]="true" />
          }
        </div>
      </section>
    }

    <section class="mid-cta" [style.background-image]="'url(' + midCtaImage + ')'">
      <span class="mid-cta-scrim" aria-hidden="true"></span>
      <div class="mid-cta-content">
        <span class="eyebrow">همراه شما در هر قدم</span>
        <h2>در کنار شما، از ایده تا اجرا</h2>
        <p>
          از انتخاب محصول مناسب فضا تا اجرای نهایی روشنایی، تیم
          {{ site.site().businessNameFa }} همراه شماست.
        </p>
        <a class="primary" routerLink="/contact">تماس با ما <span aria-hidden="true">←</span></a>
        <ul class="mid-cta-points">
          <li><i aria-hidden="true">◆</i>مشاوره تخصصی</li>
          <li><i aria-hidden="true">◆</i>پیشنهاد محصولات مناسب</li>
          <li><i aria-hidden="true">◆</i>طراحی و اجرا</li>
        </ul>
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

  protected readonly heroSlides = HERO_IMAGES;
  protected readonly midCtaImage = MID_CTA_IMAGE;
  protected readonly activeSlide = signal(0);
  protected readonly toFa = toFa;

  constructor() {
    this.site.load().subscribe();
    this.api.categories().subscribe((categories) => this.categories.set(categories));
    this.api.products({ pageSize: 5 }).subscribe((page) => this.featured.set(page.items));

    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      const intervalId = setInterval(() => {
        this.activeSlide.update((current) => (current + 1) % this.heroSlides.length);
      }, 4000);
      inject(DestroyRef).onDestroy(() => clearInterval(intervalId));
    }
  }

  protected setSlide(index: number): void {
    this.activeSlide.set(index);
  }

  protected categoryImage(index: number): string {
    return CATEGORY_IMAGES[index % CATEGORY_IMAGES.length];
  }
}
