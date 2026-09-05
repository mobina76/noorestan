import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminApiService } from '../../../core/api/admin-api.service';
import {
  AdminCategory,
  AdminProductDetail,
  AdminProductImage,
  AdminSpecificationValue,
  ProductStatus,
} from '../../../core/api/contracts';
import { readApiError } from '../../../core/http/api-error';

interface ProductForm {
  categoryId: string;
  slug: string;
  nameFa: string;
  shortDescriptionFa: string;
  descriptionFa: string;
  technicalNotesFa: string;
  displayOrder: number;
  featuresText: string;
}

@Component({
  selector: 'app-product-editor',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="head">
      <div>
        <a routerLink="/admin/products" class="back">← فهرست محصولات</a>
        <h1>{{ isNew() ? 'محصول جدید' : product()?.nameFa }}</h1>
      </div>
      @if (product(); as p) {
        <span class="status" [attr.data-status]="p.status">{{ statusLabel(p.status) }}</span>
      }
    </div>

    @if (loading()) {
      <p>در حال بارگذاری…</p>
    }

    @if (!loading()) {
      <form class="panel" (submit)="saveBasics($event)">
        <h2>اطلاعات پایه</h2>
        <div class="grid">
          <label
            >دسته‌بندی
            <select
              required
              [(ngModel)]="form.categoryId"
              name="categoryId"
              (change)="onCategoryChange()"
            >
              <option value="" disabled>انتخاب کنید</option>
              @for (category of categories(); track category.id) {
                <option [value]="category.id">{{ category.nameFa }}</option>
              }
            </select>
          </label>
          <label
            >نشانی (اسلاگ)<input required [(ngModel)]="form.slug" name="slug" class="ltr"
          /></label>
          <label>نام محصول<input required [(ngModel)]="form.nameFa" name="nameFa" /></label>
          <label
            >ترتیب نمایش<input type="number" [(ngModel)]="form.displayOrder" name="displayOrder"
          /></label>
        </div>
        <label
          >توضیح کوتاه (برای کارت محصول)<textarea
            required
            rows="2"
            [(ngModel)]="form.shortDescriptionFa"
            name="shortDescriptionFa"
          ></textarea>
        </label>
        <label
          >توضیحات کامل<textarea
            required
            rows="4"
            [(ngModel)]="form.descriptionFa"
            name="descriptionFa"
          ></textarea>
        </label>
        <label
          >یادداشت فنی (اختیاری)<textarea
            rows="2"
            [(ngModel)]="form.technicalNotesFa"
            name="technicalNotesFa"
          ></textarea>
        </label>
        <label
          >ویژگی‌ها (هر خط یک ویژگی)<textarea
            rows="3"
            [(ngModel)]="form.featuresText"
            name="featuresText"
          ></textarea>
        </label>
        @if (basicsError()) {
          <p class="error" role="alert">{{ basicsError() }}</p>
        }
        <div class="form-actions">
          <button type="submit" [disabled]="saving()">
            {{ isNew() ? 'ایجاد محصول' : 'ذخیره تغییرات' }}
          </button>
        </div>
      </form>
    }

    @if (product(); as p) {
      <section class="panel">
        <h2>وضعیت انتشار</h2>
        <p class="muted">
          محصول باید تصویر اصلی آماده و مقادیر الزامی مشخصات را داشته باشد تا قابل انتشار باشد.
        </p>
        @if (lifecycleError()) {
          <p class="error" role="alert">{{ lifecycleError() }}</p>
        }
        <div class="form-actions">
          @if (p.status === 'Draft' || p.status === 'Hidden') {
            <button type="button" (click)="changeStatus('Published')">انتشار در وب‌سایت</button>
          }
          @if (p.status === 'Published') {
            <button type="button" (click)="changeStatus('Hidden')">پنهان‌کردن</button>
          }
          @if (p.status !== 'Archived') {
            <button type="button" class="danger-outline" (click)="changeStatus('Archived')">
              بایگانی
            </button>
          }
          @if (p.status === 'Archived') {
            <button type="button" (click)="changeStatus('Draft')">بازگردانی به پیش‌نویس</button>
            <button type="button" class="danger" (click)="permanentlyDelete()">حذف دائمی</button>
          }
        </div>
      </section>

      <section class="panel">
        <h2>مشخصات فنی</h2>
        @if (specifications().length === 0) {
          <p class="muted">
            این دسته‌بندی هنوز مشخصه‌ای ندارد. از بخش «دسته‌بندی‌ها» مشخصه اضافه کنید.
          </p>
        } @else {
          <form (submit)="saveSpecifications($event)">
            <div class="grid">
              @for (spec of specifications(); track spec.definitionId) {
                <label
                  >{{ spec.labelFa }}
                  @if (spec.isRequired) {
                    <span class="req">*</span>
                  }
                  @if (spec.unitFa) {
                    <small>({{ spec.unitFa }})</small>
                  }
                  @switch (spec.valueType) {
                    @case ('Text') {
                      <input [(ngModel)]="spec.textValue" [name]="'spec-' + spec.definitionId" />
                    }
                    @case ('Number') {
                      <input
                        type="number"
                        [(ngModel)]="spec.numericValue"
                        [name]="'spec-' + spec.definitionId"
                      />
                    }
                    @case ('Boolean') {
                      <select [(ngModel)]="spec.booleanValue" [name]="'spec-' + spec.definitionId">
                        <option [ngValue]="null">تعیین‌نشده</option>
                        <option [ngValue]="true">بله</option>
                        <option [ngValue]="false">خیر</option>
                      </select>
                    }
                    @case ('Choice') {
                      <select [(ngModel)]="spec.choiceId" [name]="'spec-' + spec.definitionId">
                        <option [ngValue]="null">انتخاب کنید</option>
                        @for (choice of spec.choices; track choice.id) {
                          <option [ngValue]="choice.id">{{ choice.labelFa }}</option>
                        }
                      </select>
                    }
                  }
                </label>
              }
            </div>
            @if (specSaveError()) {
              <p class="error" role="alert">{{ specSaveError() }}</p>
            }
            <div class="form-actions">
              <button type="submit" [disabled]="savingSpecs()">ذخیره مشخصات</button>
            </div>
          </form>
        }
      </section>

      <section class="panel">
        <h2>تصاویر محصول</h2>
        <label class="upload">
          افزودن تصویر جدید
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            (change)="uploadImage($event)"
            [disabled]="uploading()"
          />
        </label>
        @if (uploading()) {
          <p class="muted">در حال بارگذاری تصویر…</p>
        }
        @if (imageError()) {
          <p class="error" role="alert">{{ imageError() }}</p>
        }
        <div class="images">
          @for (image of images(); track image.id; let index = $index) {
            <div class="image-card">
              <img
                [src]="image.variants[0]?.url ?? image.url"
                [alt]="image.altTextFa"
                width="140"
                height="120"
              />
              <input
                class="alt-input"
                placeholder="متن جایگزین تصویر"
                [value]="image.altTextFa"
                (change)="updateAlt(image, $event)"
              />
              <div class="image-actions">
                <button type="button" (click)="moveImage(index, -1)" [disabled]="index === 0">
                  ▲
                </button>
                <button
                  type="button"
                  (click)="moveImage(index, 1)"
                  [disabled]="index === images().length - 1"
                >
                  ▼
                </button>
                <button type="button" [disabled]="image.isPrimary" (click)="setPrimary(image)">
                  {{ image.isPrimary ? 'تصویر اصلی' : 'تعیین اصلی' }}
                </button>
                <button type="button" class="danger" (click)="removeImage(image)">حذف</button>
              </div>
            </div>
          } @empty {
            <p class="muted">هنوز تصویری برای این محصول بارگذاری نشده است.</p>
          }
        </div>
      </section>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 56rem;
      }
      .head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        margin-block-end: 1.2rem;
      }
      .back {
        display: inline-block;
        margin-block-end: 0.5rem;
        color: var(--color-text-muted);
        text-decoration: none;
        font-size: 0.78rem;
      }
      h1 {
        margin: 0;
        font-size: 1.5rem;
      }
      h2 {
        margin: 0 0 1rem;
        font-size: 1rem;
      }
      .status {
        padding: 0.3rem 0.7rem;
        border-radius: 999px;
        font-size: 0.75rem;
        border: 1px solid var(--color-border);
        color: var(--color-text-muted);
        align-self: flex-start;
      }
      .status[data-status='Published'] {
        color: var(--color-success);
        border-color: color-mix(in srgb, var(--color-success) 45%, var(--color-border));
      }
      .status[data-status='Archived'] {
        color: var(--color-danger);
        border-color: color-mix(in srgb, var(--color-danger) 45%, var(--color-border));
      }
      .panel {
        margin-block-end: 1.2rem;
        padding: 1.2rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-surface);
      }
      .muted {
        color: var(--color-text-muted);
        font-size: 0.82rem;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
        gap: 0.9rem;
        margin-block-end: 0.9rem;
      }
      label {
        display: block;
        color: var(--color-text-muted);
        font-size: 0.78rem;
      }
      label .req {
        color: var(--color-danger);
      }
      label small {
        color: var(--color-text-muted);
        font-weight: 400;
      }
      input,
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
      input.ltr {
        direction: ltr;
        text-align: right;
        font-family: monospace;
      }
      .form-actions {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
        margin-block-start: 0.6rem;
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
      .form-actions button[type='submit'] {
        border: 0;
        background: var(--color-primary);
        color: var(--color-primary-contrast);
        font-weight: 700;
      }
      .form-actions .danger {
        color: var(--color-primary-contrast);
        background: var(--color-danger);
        border: 0;
      }
      .form-actions .danger-outline {
        color: var(--color-danger);
        border-color: color-mix(in srgb, var(--color-danger) 45%, var(--color-border));
      }
      .error {
        padding: 0.6rem 0.9rem;
        border-inline-start: 2px solid var(--color-danger);
        background: rgb(255 154 171/8%);
        color: var(--color-danger);
        font-size: 0.8rem;
        border-radius: 0.4rem;
        margin-block-end: 0.6rem;
      }
      .upload {
        display: inline-flex;
        flex-direction: column;
        gap: 0.4rem;
        padding: 0.7rem 1rem;
        border: 1px dashed var(--color-border);
        border-radius: 0.6rem;
        color: var(--color-primary);
        font-size: 0.82rem;
        margin-block-end: 1rem;
        cursor: pointer;
      }
      .images {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
        gap: 1rem;
      }
      .image-card {
        padding: 0.6rem;
        border: 1px solid var(--color-border);
        border-radius: 0.6rem;
        background: var(--color-bg-elevated);
      }
      .image-card img {
        width: 100%;
        height: 6.5rem;
        object-fit: cover;
        border-radius: 0.4rem;
        margin-block-end: 0.5rem;
      }
      .alt-input {
        font-size: 0.72rem;
        padding: 0.4rem;
      }
      .image-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.3rem;
        margin-block-start: 0.5rem;
      }
      .image-actions button {
        padding: 0.25rem 0.5rem;
        font-size: 0.68rem;
        border: 1px solid var(--color-border);
        border-radius: 0.35rem;
        background: transparent;
        color: var(--color-text);
        cursor: pointer;
      }
      .image-actions button.danger {
        color: var(--color-danger);
      }
      .image-actions button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    `,
  ],
})
export class ProductEditorComponent {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly savingSpecs = signal(false);
  protected readonly uploading = signal(false);
  protected readonly basicsError = signal<string | null>(null);
  protected readonly lifecycleError = signal<string | null>(null);
  protected readonly specSaveError = signal<string | null>(null);
  protected readonly imageError = signal<string | null>(null);

  protected readonly categories = signal<ReadonlyArray<AdminCategory>>([]);
  protected readonly product = signal<AdminProductDetail | null>(null);
  protected readonly specifications = signal<AdminSpecificationValue[]>([]);
  protected readonly images = signal<ReadonlyArray<AdminProductImage>>([]);

  protected readonly isNew = computed(() => this.route.snapshot.paramMap.get('id') === null);
  protected form: ProductForm = {
    categoryId: '',
    slug: '',
    nameFa: '',
    shortDescriptionFa: '',
    descriptionFa: '',
    technicalNotesFa: '',
    displayOrder: 0,
    featuresText: '',
  };

  constructor() {
    this.api.categories().subscribe((categories) => this.categories.set(categories));
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.api.product(id).subscribe({
        next: (product) => this.applyProduct(product),
        error: (error: unknown) => {
          this.basicsError.set(readApiError(error).title);
          this.loading.set(false);
        },
      });
    } else {
      this.loading.set(false);
    }
  }

  private applyProduct(product: AdminProductDetail): void {
    this.product.set(product);
    this.form = {
      categoryId: product.categoryId,
      slug: product.slug,
      nameFa: product.nameFa,
      shortDescriptionFa: product.shortDescriptionFa,
      descriptionFa: product.descriptionFa,
      technicalNotesFa: product.technicalNotesFa ?? '',
      displayOrder: product.displayOrder,
      featuresText: product.features.join('\n'),
    };
    this.specifications.set(product.specifications.map((s) => ({ ...s })));
    this.images.set(product.images);
    this.loading.set(false);
  }

  protected statusLabel(status: ProductStatus): string {
    return { Draft: 'پیش‌نویس', Published: 'منتشرشده', Hidden: 'پنهان', Archived: 'بایگانی‌شده' }[
      status
    ];
  }

  protected onCategoryChange(): void {
    if (!this.isNew())
      this.basicsError.set(
        'توجه: تغییر دسته‌بندی، مقادیر مشخصات فنی متعلق به دسته قبلی را پس از ذخیره پاک می‌کند.',
      );
  }

  protected saveBasics(event: Event): void {
    event.preventDefault();
    this.saving.set(true);
    this.basicsError.set(null);
    const body = {
      categoryId: this.form.categoryId,
      slug: this.form.slug.trim(),
      nameFa: this.form.nameFa.trim(),
      shortDescriptionFa: this.form.shortDescriptionFa.trim(),
      descriptionFa: this.form.descriptionFa.trim(),
      technicalNotesFa: this.form.technicalNotesFa.trim() || null,
      displayOrder: this.form.displayOrder,
      features: this.form.featuresText
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean),
    };
    const existing = this.product();
    const request = existing
      ? this.api.updateProduct(existing.id, body, existing.version)
      : this.api.createProduct(body);
    request.subscribe({
      next: (saved) => {
        this.saving.set(false);
        if (!existing) {
          this.router.navigate(['/admin/products', saved.id]);
          return;
        }
        this.api.product(existing.id).subscribe((refreshed) => this.applyProduct(refreshed));
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.basicsError.set(readApiError(error).title);
      },
    });
  }

  protected changeStatus(target: ProductStatus): void {
    const product = this.product();
    if (!product) return;
    if (target === 'Archived' && !confirm('این محصول بایگانی شود؟ از وب‌سایت عمومی حذف می‌شود.'))
      return;
    this.api.changeStatus(product.id, target, product.version).subscribe({
      next: () => {
        this.lifecycleError.set(null);
        this.api.product(product.id).subscribe((refreshed) => this.applyProduct(refreshed));
      },
      error: (error: unknown) => this.lifecycleError.set(readApiError(error).title),
    });
  }

  protected permanentlyDelete(): void {
    const product = this.product();
    if (!product) return;
    if (!confirm('این عملیات غیرقابل بازگشت است و محصول برای همیشه حذف می‌شود. ادامه می‌دهید؟'))
      return;
    this.api.deleteProduct(product.id, product.version).subscribe({
      next: () => this.router.navigateByUrl('/admin/products'),
      error: (error: unknown) => this.lifecycleError.set(readApiError(error).title),
    });
  }

  protected saveSpecifications(event: Event): void {
    event.preventDefault();
    const product = this.product();
    if (!product) return;
    this.savingSpecs.set(true);
    const values = this.specifications().map((s) => ({
      definitionId: s.definitionId,
      textValue: s.textValue ?? null,
      numericValue: s.numericValue ?? null,
      booleanValue: s.booleanValue ?? null,
      choiceId: s.choiceId ?? null,
    }));
    this.api.updateSpecificationValues(product.id, values, product.version).subscribe({
      next: () => {
        this.savingSpecs.set(false);
        this.specSaveError.set(null);
        this.api.product(product.id).subscribe((refreshed) => this.applyProduct(refreshed));
      },
      error: (error: unknown) => {
        this.savingSpecs.set(false);
        this.specSaveError.set(readApiError(error).title);
      },
    });
  }

  protected uploadImage(event: Event): void {
    const product = this.product();
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!product || !file) return;
    this.uploading.set(true);
    this.api.uploadImage(product.id, file, product.nameFa).subscribe({
      next: () => {
        this.uploading.set(false);
        this.imageError.set(null);
        input.value = '';
        this.api.product(product.id).subscribe((refreshed) => this.applyProduct(refreshed));
      },
      error: (error: unknown) => {
        this.uploading.set(false);
        this.imageError.set(readApiError(error).title);
        input.value = '';
      },
    });
  }

  protected updateAlt(image: AdminProductImage, event: Event): void {
    const product = this.product();
    if (!product) return;
    const value = (event.target as HTMLInputElement).value;
    this.api.updateImageAltText(product.id, image.id, value).subscribe();
  }

  protected setPrimary(image: AdminProductImage): void {
    const product = this.product();
    if (!product) return;
    this.api
      .setPrimaryImage(product.id, image.id)
      .subscribe(() =>
        this.api.product(product.id).subscribe((refreshed) => this.applyProduct(refreshed)),
      );
  }

  protected removeImage(image: AdminProductImage): void {
    const product = this.product();
    if (!product) return;
    if (!confirm('این تصویر حذف شود؟')) return;
    this.api
      .removeImage(product.id, image.id)
      .subscribe(() =>
        this.api.product(product.id).subscribe((refreshed) => this.applyProduct(refreshed)),
      );
  }

  protected moveImage(index: number, delta: number): void {
    const product = this.product();
    const current = [...this.images()];
    const targetIndex = index + delta;
    if (!product || targetIndex < 0 || targetIndex >= current.length) return;
    [current[index], current[targetIndex]] = [current[targetIndex], current[index]];
    this.images.set(current);
    this.api
      .reorderImages(
        product.id,
        current.map((i) => i.id),
      )
      .subscribe(() =>
        this.api.product(product.id).subscribe((refreshed) => this.applyProduct(refreshed)),
      );
  }
}
