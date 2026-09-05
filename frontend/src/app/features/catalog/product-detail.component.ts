import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PublicApiService } from '../../core/api/public-api.service';
import { PublicProductDetail, PublicProductSummary } from '../../core/api/contracts';
import { SiteStore } from '../../core/site/site.store';
import { ProductCardComponent } from '../../shared/product-card.component';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, ProductCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <section class="state"><p>در حال بارگذاری…</p></section>
    } @else if (product(); as item) {
      <div class="crumb">
        <a routerLink="/products">محصولات</a><span>/</span><span>{{ item.category.nameFa }}</span
        ><span>/</span><b>{{ item.nameFa }}</b>
      </div>
      <section class="product">
        <div class="gallery">
          <div class="main-visual">
            @if (activeImage(); as img) {
              <img
                [src]="largestVariant(img)?.url"
                [alt]="img.altTextFa"
                width="720"
                height="600"
              />
            } @else {
              <span class="placeholder">تصویری ثبت نشده است</span>
            }
          </div>
          @if (item.images.length > 1) {
            <div class="thumbs">
              @for (img of item.images; track img.id) {
                <button
                  type="button"
                  [class.active]="activeImage() === img"
                  (click)="activeImage.set(img)"
                  [attr.aria-label]="img.altTextFa || 'تصویر محصول'"
                >
                  <img [src]="smallestVariant(img)?.url" [alt]="''" width="80" height="64" />
                </button>
              }
            </div>
          }
        </div>
        <div class="info">
          <span class="category">{{ item.category.nameFa }}</span>
          <h1>{{ item.nameFa }}</h1>
          @if (item.mazinoorProductCode) {
            <p class="code">{{ item.mazinoorProductCode }}</p>
          }
          <p class="lead">{{ item.shortDescriptionFa }}</p>
          <div class="actions">
            @if (site.hasWhatsApp()) {
              <a [href]="whatsapp()" class="primary">گفت‌وگو در واتساپ</a>
            }
            @if (site.primaryPhone(); as phone) {
              <a [href]="site.telLink(phone.number)">تماس تلفنی</a>
            }
            @if (site.hasEmail()) {
              <a [href]="mail()">ارسال ایمیل</a>
            }
          </div>
          <p class="notice">
            قیمت و موجودی این محصول به‌روز استعلام می‌شود. برای سفارش با نورستان تماس بگیرید.
          </p>
          @if (item.features.length) {
            <div class="features">
              @for (feature of item.features; track feature) {
                <span><i>✓</i>{{ feature }}</span>
              }
            </div>
          }
        </div>
      </section>

      @if (item.descriptionFa) {
        <section class="description">
          <h2>معرفی محصول</h2>
          <p>{{ item.descriptionFa }}</p>
          @if (item.technicalNotesFa) {
            <p class="notes">{{ item.technicalNotesFa }}</p>
          }
        </section>
      }

      @if (item.specifications.length) {
        <section class="specs">
          <div>
            <span>اطلاعات فنی</span>
            <h2>مشخصات محصول</h2>
          </div>
          <dl>
            @for (spec of item.specifications; track spec.key) {
              <div>
                <dt>{{ spec.labelFa }}</dt>
                <dd>{{ spec.displayValueFa }}</dd>
              </div>
            }
          </dl>
        </section>
      }

      @if (related().length) {
        <section class="related">
          <div>
            <span>پیشنهادهای مرتبط</span>
            <h2>محصولات دیگر این دسته</h2>
          </div>
          <div>
            @for (relatedProduct of related(); track relatedProduct.id) {
              <app-product-card [product]="relatedProduct" />
            }
          </div>
        </section>
      }
    } @else {
      <section class="missing">
        <h1>محصول پیدا نشد</h1>
        <p>این محصول منتشر نشده یا آدرس آن اشتباه است.</p>
        <a routerLink="/products">بازگشت به محصولات</a>
      </section>
    }
  `,
  styles: [
    `
      .state {
        min-height: 40vh;
        display: grid;
        place-items: center;
        color: var(--color-text-muted);
      }
      .crumb {
        display: flex;
        gap: 0.6rem;
        max-width: 78rem;
        margin: auto;
        padding: 1.4rem clamp(1rem, 4vw, 2.5rem);
        color: var(--color-text-muted);
        font-size: 0.72rem;
      }
      .crumb a {
        color: var(--color-primary);
        text-decoration: none;
      }
      .product {
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: clamp(1.5rem, 4vw, 3.5rem);
        max-width: 78rem;
        margin: auto;
        padding: 0 clamp(1rem, 4vw, 2.5rem) var(--space-section);
      }
      .main-visual {
        position: relative;
        display: grid;
        place-items: center;
        aspect-ratio: 6/5;
        overflow: hidden;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        background: var(--color-bg-elevated);
      }
      .main-visual img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .placeholder {
        color: var(--color-text-muted);
        font-size: 0.85rem;
      }
      .thumbs {
        display: flex;
        gap: 0.6rem;
        margin-block-start: 0.7rem;
        flex-wrap: wrap;
      }
      .thumbs button {
        padding: 0;
        width: 5rem;
        height: 4rem;
        border: 1px solid var(--color-border);
        border-radius: 0.5rem;
        overflow: hidden;
        background: var(--color-surface);
        cursor: pointer;
      }
      .thumbs button img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .thumbs button.active {
        border-color: var(--color-primary);
      }
      .info {
        align-self: center;
      }
      .category {
        color: var(--color-primary);
        font-size: 0.78rem;
      }
      .info h1 {
        margin: 0.5rem 0 0;
        font-size: clamp(1.7rem, 3.2vw, 2.5rem);
        line-height: 1.2;
        letter-spacing: -0.02em;
      }
      .code {
        direction: ltr;
        text-align: right;
        color: var(--color-text-muted);
        font: 500 0.75rem monospace;
        margin: 0.3rem 0 0;
      }
      .lead {
        margin-block: 1rem;
        color: var(--color-text-muted);
        font-size: 0.95rem;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
      }
      .actions a {
        padding: 0.75rem 1.1rem;
        border: 1px solid var(--color-border);
        border-radius: 999px;
        color: var(--color-text);
        text-decoration: none;
        font-size: 0.85rem;
      }
      .actions .primary {
        border-color: var(--color-primary);
        background: var(--color-primary);
        color: var(--color-primary-contrast);
      }
      .notice {
        margin-block-start: 1.2rem;
        padding: 0.8rem 1rem;
        border-inline-start: 2px solid var(--color-primary);
        background: rgb(139 212 255/5%);
        color: var(--color-text-muted);
        font-size: 0.76rem;
      }
      .features {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.6rem;
        margin-block-start: 1.4rem;
      }
      .features span {
        color: var(--color-text-muted);
        font-size: 0.8rem;
      }
      .features i {
        margin-inline-end: 0.4rem;
        color: var(--color-primary);
        font-style: normal;
      }
      .description {
        max-width: 78rem;
        margin: auto;
        padding: 0 clamp(1rem, 4vw, 2.5rem) var(--space-section);
      }
      .description h2 {
        font-size: 1.1rem;
        margin-block-end: 0.6rem;
      }
      .description p {
        max-width: 52rem;
        color: var(--color-text-muted);
        line-height: 1.9;
        font-size: 0.92rem;
      }
      .description .notes {
        color: var(--color-text-muted);
        font-size: 0.82rem;
        border-inline-start: 2px solid var(--color-border);
        padding-inline-start: 0.8rem;
      }
      .specs {
        display: grid;
        grid-template-columns: 0.5fr 1fr;
        gap: 2rem;
        padding: var(--space-section) max(clamp(1rem, 8vw, 8rem), calc((100vw - 78rem) / 2));
        background: var(--color-bg-elevated);
      }
      .specs span,
      .related span {
        color: var(--color-primary);
        font-size: 0.72rem;
      }
      .specs h2,
      .related h2 {
        margin: 0.4rem 0;
        font-size: 1.4rem;
      }
      dl {
        margin: 0;
      }
      dl div {
        display: flex;
        justify-content: space-between;
        gap: 2rem;
        padding: 0.7rem 0;
        border-block-start: 1px solid var(--color-border);
      }
      dt {
        color: var(--color-text-muted);
      }
      dd {
        margin: 0;
        text-align: end;
      }
      .related {
        max-width: 78rem;
        margin: auto;
        padding: var(--space-section) clamp(1rem, 4vw, 2.5rem);
      }
      .related > div:last-child {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        margin-block-start: 1.2rem;
      }
      .missing {
        min-height: 50vh;
        padding: 5rem 2rem;
        text-align: center;
      }
      .missing a {
        color: var(--color-primary);
      }
      @media (max-width: 60rem) {
        .product,
        .specs {
          grid-template-columns: 1fr;
        }
        .related > div:last-child {
          grid-template-columns: 1fr 1fr;
        }
      }
      @media (max-width: 38rem) {
        .features,
        .related > div:last-child {
          grid-template-columns: 1fr;
        }
        .specs {
          gap: 1rem;
        }
      }
    `,
  ],
})
export class ProductDetailComponent {
  private readonly api = inject(PublicApiService);
  private readonly route = inject(ActivatedRoute);
  protected readonly site = inject(SiteStore);

  protected readonly loading = signal(true);
  protected readonly product = signal<PublicProductDetail | null>(null);
  protected readonly activeImage = signal<PublicProductDetail['images'][number] | null>(null);
  protected readonly related = signal<ReadonlyArray<PublicProductSummary>>([]);

  protected readonly whatsapp = computed(() => {
    const item = this.product();
    return this.site.whatsAppLink(
      item
        ? `سلام، درباره ${item.nameFa}${item.mazinoorProductCode ? ' با کد ' + item.mazinoorProductCode : ''} اطلاعات می‌خواهم.`
        : 'سلام، می‌خواستم درباره یک محصول اطلاعات بگیرم.',
    );
  });
  protected readonly mail = computed(() =>
    this.site.mailLink(
      this.product() ? `استعلام محصول ${this.product()!.nameFa}` : 'استعلام محصول',
    ),
  );

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (!slug) return;
      this.loading.set(true);
      this.product.set(null);
      this.api.product(slug).subscribe({
        next: (product) => {
          this.product.set(product);
          this.activeImage.set(product.images[0] ?? null);
          this.loading.set(false);
          this.api.products({ category: product.category.slug, pageSize: 5 }).subscribe((page) => {
            this.related.set(page.items.filter((p) => p.slug !== slug).slice(0, 4));
          });
        },
        error: () => {
          this.loading.set(false);
          this.product.set(null);
        },
      });
    });
  }

  protected largestVariant(image: PublicProductDetail['images'][number]) {
    return [...image.variants].sort((a, b) => b.width - a.width)[0];
  }

  protected smallestVariant(image: PublicProductDetail['images'][number]) {
    return [...image.variants].sort((a, b) => a.width - b.width)[0];
  }
}
