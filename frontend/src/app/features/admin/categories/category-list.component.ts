import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../core/api/admin-api.service';
import {
  AdminCategory,
  AdminSpecificationDefinition,
  SpecificationValueType,
} from '../../../core/api/contracts';
import { readApiError } from '../../../core/http/api-error';

interface CategoryForm {
  id: string | null;
  slug: string;
  nameFa: string;
  descriptionFa: string;
  displayOrder: number;
  isVisible: boolean;
  version: number;
}

interface SpecForm {
  id: string | null;
  key: string;
  labelFa: string;
  valueType: SpecificationValueType;
  unitFa: string;
  isRequired: boolean;
  isFilterable: boolean;
  displayOrder: number;
  choicesText: string;
  version: number;
}

const EMPTY_CATEGORY: CategoryForm = {
  id: null,
  slug: '',
  nameFa: '',
  descriptionFa: '',
  displayOrder: 0,
  isVisible: true,
  version: 0,
};
const EMPTY_SPEC: SpecForm = {
  id: null,
  key: '',
  labelFa: '',
  valueType: 'Text',
  unitFa: '',
  isRequired: false,
  isFilterable: false,
  displayOrder: 0,
  choicesText: '',
  version: 0,
};

@Component({
  selector: 'app-category-list',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>دسته‌بندی‌ها</h1>
    <p class="lead">دسته‌بندی‌ها و مشخصات فنی مخصوص هر دسته را مدیریت کنید.</p>

    <table class="list">
      <thead>
        <tr>
          <th>نام</th>
          <th>نشانی</th>
          <th>محصولات</th>
          <th>نمایش</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        @for (category of categories(); track category.id) {
          <tr [class.selected]="selected()?.id === category.id">
            <td>{{ category.nameFa }}</td>
            <td class="mono">{{ category.slug }}</td>
            <td>{{ category.productCount }}</td>
            <td>{{ category.isVisible ? 'نمایان' : 'پنهان' }}</td>
            <td class="row-actions">
              <button type="button" (click)="select(category)">ویرایش</button>
              <button
                type="button"
                class="danger"
                (click)="remove(category)"
                [disabled]="category.productCount > 0"
              >
                حذف
              </button>
            </td>
          </tr>
        } @empty {
          <tr>
            <td colspan="5">هنوز دسته‌بندی‌ای ثبت نشده است.</td>
          </tr>
        }
      </tbody>
    </table>
    <button type="button" class="add-button" (click)="startCreate()">+ دسته‌بندی جدید</button>

    @if (form(); as f) {
      <section class="editor">
        <h2>{{ f.id ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید' }}</h2>
        <form (submit)="saveCategory($event)">
          <div class="grid">
            <label>نام فارسی<input required [(ngModel)]="f.nameFa" name="nameFa" /></label>
            <label
              >نشانی (اسلاگ)<input required [(ngModel)]="f.slug" name="slug" class="ltr"
            /></label>
            <label
              >ترتیب نمایش<input type="number" [(ngModel)]="f.displayOrder" name="displayOrder"
            /></label>
            <label class="checkbox"
              ><input type="checkbox" [(ngModel)]="f.isVisible" name="isVisible" /> نمایش در
              وب‌سایت</label
            >
          </div>
          <label
            >توضیحات<textarea
              rows="2"
              [(ngModel)]="f.descriptionFa"
              name="descriptionFa"
            ></textarea>
          </label>
          @if (errorMessage()) {
            <p class="error" role="alert">{{ errorMessage() }}</p>
          }
          <div class="form-actions">
            <button type="submit">ذخیره</button>
            <button type="button" (click)="cancel()">انصراف</button>
          </div>
        </form>

        @if (f.id) {
          <hr />
          <h3>مشخصات فنی این دسته‌بندی</h3>
          <table class="list">
            <thead>
              <tr>
                <th>برچسب</th>
                <th>کلید</th>
                <th>نوع</th>
                <th>الزامی</th>
                <th>فیلترپذیر</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (spec of specifications(); track spec.id) {
                <tr>
                  <td>{{ spec.labelFa }}</td>
                  <td class="mono">{{ spec.key }}</td>
                  <td>{{ typeLabel(spec.valueType) }}</td>
                  <td>{{ spec.isRequired ? 'بله' : 'خیر' }}</td>
                  <td>{{ spec.isFilterable ? 'بله' : 'خیر' }}</td>
                  <td class="row-actions">
                    <button type="button" (click)="selectSpec(spec)">ویرایش</button>
                    <button type="button" class="danger" (click)="removeSpec(spec)">حذف</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6">هنوز مشخصه‌ای تعریف نشده است.</td>
                </tr>
              }
            </tbody>
          </table>
          <button type="button" class="add-button" (click)="startCreateSpec()">+ مشخصه جدید</button>

          @if (specForm(); as sf) {
            <form class="spec-editor" (submit)="saveSpec($event)">
              <div class="grid">
                <label>برچسب فارسی<input required [(ngModel)]="sf.labelFa" name="labelFa" /></label>
                <label
                  >کلید<input
                    required
                    [(ngModel)]="sf.key"
                    name="key"
                    class="ltr"
                    [disabled]="!!sf.id"
                /></label>
                <label
                  >نوع مقدار
                  <select [(ngModel)]="sf.valueType" name="valueType">
                    <option value="Text">متنی</option>
                    <option value="Number">عددی</option>
                    <option value="Boolean">بله/خیر</option>
                    <option value="Choice">انتخابی</option>
                  </select>
                </label>
                <label>واحد<input [(ngModel)]="sf.unitFa" name="unitFa" /></label>
                <label class="checkbox"
                  ><input type="checkbox" [(ngModel)]="sf.isRequired" name="isRequired" /> الزامی
                  برای انتشار</label
                >
                <label class="checkbox"
                  ><input
                    type="checkbox"
                    [(ngModel)]="sf.isFilterable"
                    name="isFilterable"
                    [disabled]="sf.valueType === 'Text'"
                  />
                  قابل فیلتر در کاتالوگ</label
                >
              </div>
              @if (sf.valueType === 'Choice') {
                <label
                  >گزینه‌ها (هر خط یک گزینه)<textarea
                    rows="3"
                    [(ngModel)]="sf.choicesText"
                    name="choicesText"
                  ></textarea>
                </label>
              }
              @if (specErrorMessage()) {
                <p class="error" role="alert">{{ specErrorMessage() }}</p>
              }
              <div class="form-actions">
                <button type="submit">ذخیره مشخصه</button>
                <button type="button" (click)="specForm.set(null)">انصراف</button>
              </div>
            </form>
          }
        }
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
        font-size: 1.15rem;
        margin-block-end: 1rem;
      }
      h3 {
        font-size: 0.95rem;
        color: var(--color-text-muted);
        margin-block: 1.5rem 0.8rem;
      }
      .lead {
        margin: 0 0 1.2rem;
        color: var(--color-text-muted);
        font-size: 0.85rem;
      }
      table.list {
        width: 100%;
        border-collapse: collapse;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        overflow: hidden;
        font-size: 0.85rem;
      }
      table.list th {
        text-align: start;
        padding: 0.6rem 0.8rem;
        color: var(--color-text-muted);
        font-weight: 600;
        border-block-end: 1px solid var(--color-border);
        font-size: 0.75rem;
      }
      table.list td {
        padding: 0.6rem 0.8rem;
        border-block-end: 1px solid var(--color-border);
      }
      tr.selected td {
        background: rgb(139 212 255/6%);
      }
      .mono {
        direction: ltr;
        text-align: right;
        font-family: monospace;
        color: var(--color-text-muted);
      }
      .row-actions {
        display: flex;
        gap: 0.4rem;
        white-space: nowrap;
      }
      .row-actions button {
        padding: 0.3rem 0.6rem;
        border: 1px solid var(--color-border);
        border-radius: 0.4rem;
        background: transparent;
        color: var(--color-text);
        font-size: 0.75rem;
        cursor: pointer;
      }
      .row-actions button.danger {
        color: var(--color-danger);
        border-color: color-mix(in srgb, var(--color-danger) 40%, var(--color-border));
      }
      .row-actions button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .add-button {
        margin-block-start: 0.8rem;
        padding: 0.6rem 1rem;
        border: 1px dashed var(--color-border);
        border-radius: 0.6rem;
        background: transparent;
        color: var(--color-primary);
        cursor: pointer;
        font-size: 0.82rem;
      }
      .editor {
        margin-block-start: 2rem;
        padding: 1.2rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-surface);
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
        gap: 0.9rem;
        margin-block-end: 0.9rem;
      }
      label {
        display: block;
        color: var(--color-text-muted);
        font-size: 0.78rem;
      }
      label.checkbox {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        align-self: end;
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
        margin-block-start: 0.8rem;
      }
      .form-actions button[type='submit'] {
        padding: 0.6rem 1.2rem;
        border: 0;
        border-radius: 999px;
        background: var(--color-primary);
        color: var(--color-primary-contrast);
        font-weight: 700;
        cursor: pointer;
      }
      .form-actions button[type='button'] {
        padding: 0.6rem 1.2rem;
        border: 1px solid var(--color-border);
        border-radius: 999px;
        background: transparent;
        color: var(--color-text);
        cursor: pointer;
      }
      .spec-editor {
        margin-block-start: 1rem;
        padding: 1rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-bg-elevated);
      }
      .error {
        padding: 0.6rem 0.9rem;
        border-inline-start: 2px solid var(--color-danger);
        background: rgb(255 154 171/8%);
        color: var(--color-danger);
        font-size: 0.8rem;
        border-radius: 0.4rem;
      }
      hr {
        border: 0;
        border-block-start: 1px solid var(--color-border);
        margin-block: 1.5rem;
      }
    `,
  ],
})
export class CategoryListComponent {
  private readonly api = inject(AdminApiService);

  protected readonly categories = signal<ReadonlyArray<AdminCategory>>([]);
  protected readonly selected = signal<AdminCategory | null>(null);
  protected readonly form = signal<CategoryForm | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly specifications = signal<ReadonlyArray<AdminSpecificationDefinition>>([]);
  protected readonly specForm = signal<SpecForm | null>(null);
  protected readonly specErrorMessage = signal<string | null>(null);

  constructor() {
    this.reloadCategories();
  }

  private reloadCategories(): void {
    this.api.categories().subscribe((categories) => this.categories.set(categories));
  }

  protected select(category: AdminCategory): void {
    this.selected.set(category);
    this.form.set({
      id: category.id,
      slug: category.slug,
      nameFa: category.nameFa,
      descriptionFa: category.descriptionFa ?? '',
      displayOrder: category.displayOrder,
      isVisible: category.isVisible,
      version: category.version,
    });
    this.errorMessage.set(null);
    this.specForm.set(null);
    this.reloadSpecifications(category.id);
  }

  protected startCreate(): void {
    this.selected.set(null);
    this.form.set({ ...EMPTY_CATEGORY, displayOrder: this.categories().length });
    this.errorMessage.set(null);
    this.specifications.set([]);
  }

  protected cancel(): void {
    this.form.set(null);
    this.selected.set(null);
    this.specForm.set(null);
  }

  protected saveCategory(event: Event): void {
    event.preventDefault();
    const f = this.form();
    if (!f) return;
    const body = {
      slug: f.slug.trim(),
      nameFa: f.nameFa.trim(),
      descriptionFa: f.descriptionFa.trim() || null,
      displayOrder: f.displayOrder,
      isVisible: f.isVisible,
    };
    const request = f.id
      ? this.api.updateCategory(f.id, body, f.version)
      : this.api.createCategory(body);
    request.subscribe({
      next: (saved) => {
        this.errorMessage.set(null);
        this.reloadCategories();
        this.select({
          ...saved,
          productCount: this.selected()?.productCount ?? 0,
        } as AdminCategory);
      },
      error: (error: unknown) => this.errorMessage.set(readApiError(error).title),
    });
  }

  protected remove(category: AdminCategory): void {
    if (category.productCount > 0) return;
    if (!confirm(`دسته‌بندی «${category.nameFa}» حذف شود؟`)) return;
    this.api.deleteCategory(category.id, category.version).subscribe(() => {
      this.reloadCategories();
      if (this.selected()?.id === category.id) this.cancel();
    });
  }

  private reloadSpecifications(categoryId: string): void {
    this.api.specifications(categoryId).subscribe((specs) => this.specifications.set(specs));
  }

  protected typeLabel(type: SpecificationValueType): string {
    return { Text: 'متنی', Number: 'عددی', Boolean: 'بله/خیر', Choice: 'انتخابی' }[type];
  }

  protected startCreateSpec(): void {
    this.specForm.set({ ...EMPTY_SPEC, displayOrder: this.specifications().length });
    this.specErrorMessage.set(null);
  }

  protected selectSpec(spec: AdminSpecificationDefinition): void {
    this.specForm.set({
      id: spec.id,
      key: spec.key,
      labelFa: spec.labelFa,
      valueType: spec.valueType,
      unitFa: spec.unitFa ?? '',
      isRequired: spec.isRequired,
      isFilterable: spec.isFilterable,
      displayOrder: spec.displayOrder,
      version: spec.version,
      choicesText: spec.choices.map((c) => c.labelFa).join('\n'),
    });
    this.specErrorMessage.set(null);
  }

  protected saveSpec(event: Event): void {
    event.preventDefault();
    const categoryId = this.selected()?.id;
    const sf = this.specForm();
    if (!categoryId || !sf) return;
    const body = {
      key: sf.key.trim(),
      labelFa: sf.labelFa.trim(),
      valueType: sf.valueType,
      unitFa: sf.unitFa.trim() || null,
      isRequired: sf.isRequired,
      isFilterable: sf.valueType === 'Text' ? false : sf.isFilterable,
      displayOrder: sf.displayOrder,
      choices: sf.choicesText
        .split('\n')
        .map((c) => c.trim())
        .filter(Boolean),
    };
    const request = sf.id
      ? this.api.updateSpecification(categoryId, sf.id, body, sf.version)
      : this.api.createSpecification(categoryId, body);
    request.subscribe({
      next: () => {
        this.specErrorMessage.set(null);
        this.specForm.set(null);
        this.reloadSpecifications(categoryId);
      },
      error: (error: unknown) => this.specErrorMessage.set(readApiError(error).title),
    });
  }

  protected removeSpec(spec: AdminSpecificationDefinition): void {
    const categoryId = this.selected()?.id;
    if (!categoryId) return;
    if (!confirm(`مشخصه «${spec.labelFa}» حذف شود؟`)) return;
    this.api.deleteSpecification(categoryId, spec.id, spec.version).subscribe({
      next: () => this.reloadSpecifications(categoryId),
      error: (error: unknown) => this.specErrorMessage.set(readApiError(error).title),
    });
  }
}
