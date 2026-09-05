import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../core/api/admin-api.service';
import { BusinessProfile, ManagedContentEntity } from '../../../core/api/contracts';
import { readApiError } from '../../../core/http/api-error';

const SLOTS: ReadonlyArray<{ readonly key: string; readonly label: string }> = [
  { key: 'home.hero', label: 'صفحه اصلی — بخش معرفی (هیرو)' },
  { key: 'home.why-noorestan', label: 'صفحه اصلی — چرا نورستان' },
  { key: 'home.company-intro', label: 'صفحه اصلی — معرفی کوتاه' },
  { key: 'home.contact-band', label: 'صفحه اصلی — نوار تماس پایانی' },
  { key: 'company.intro', label: 'درباره ما — معرفی' },
  { key: 'contact.notice', label: 'تماس — یادداشت فروش' },
];

interface SlotForm {
  key: string;
  label: string;
  titleFa: string;
  bodyFa: string;
  callToActionLabelFa: string;
  callToActionTarget: string;
  isVisible: boolean;
  version: number;
}

@Component({
  selector: 'app-content-editor',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>محتوای سایت</h1>
    <p class="lead">اطلاعات تماس و متن‌های قابل ویرایش صفحات عمومی را این‌جا به‌روزرسانی کنید.</p>

    <section class="panel">
      <h2>پروفایل کسب‌وکار</h2>
      <form (submit)="saveProfile($event)">
        <div class="grid">
          <label
            >نام کسب‌وکار<input
              required
              [(ngModel)]="profileForm.businessNameFa"
              name="businessNameFa"
          /></label>
          <label
            >عبارت نمایندگی<input
              required
              [(ngModel)]="profileForm.representativeStatementFa"
              name="representativeStatementFa"
          /></label>
          <label
            >تلفن ثابت<input
              [(ngModel)]="profileForm.phone"
              name="phone"
              class="ltr"
              placeholder="مثلاً 02100000000"
          /></label>
          <label
            >واتساپ<input
              [(ngModel)]="profileForm.whatsApp"
              name="whatsApp"
              class="ltr"
              placeholder="مثلاً 982100000000"
          /></label>
          <label>ایمیل<input [(ngModel)]="profileForm.email" name="email" class="ltr" /></label>
          <label
            >ساعات کاری<input [(ngModel)]="profileForm.operatingHoursFa" name="operatingHoursFa"
          /></label>
        </div>
        <label
          >نشانی<textarea rows="2" [(ngModel)]="profileForm.addressFa" name="addressFa"></textarea>
        </label>
        <p class="hint">
          فیلدهای خالی (مانند تلفن یا ایمیل) در وب‌سایت عمومی نمایش داده نمی‌شوند تا اطلاعات نادرست
          دیده نشود.
        </p>
        @if (profileError()) {
          <p class="error" role="alert">{{ profileError() }}</p>
        }
        @if (profileSaved()) {
          <p class="success">اطلاعات ذخیره شد.</p>
        }
        <div class="form-actions">
          <button type="submit" [disabled]="savingProfile()">ذخیره پروفایل</button>
        </div>
      </form>
    </section>

    <section class="panel">
      <h2>بخش‌های محتوایی</h2>
      <div class="slot-tabs">
        @for (slot of slotForms(); track slot.key) {
          <button
            type="button"
            [class.active]="activeSlot() === slot.key"
            (click)="activeSlot.set(slot.key)"
          >
            {{ slot.label }}
          </button>
        }
      </div>
      @if (currentSlot(); as slot) {
        <form (submit)="saveSlot($event, slot)">
          <label>عنوان<input required [(ngModel)]="slot.titleFa" name="titleFa" /></label>
          <label
            >متن<textarea required rows="3" [(ngModel)]="slot.bodyFa" name="bodyFa"></textarea>
          </label>
          <div class="grid">
            <label
              >برچسب دکمه (اختیاری)<input
                [(ngModel)]="slot.callToActionLabelFa"
                name="callToActionLabelFa"
            /></label>
            <label
              >مقصد دکمه (اختیاری)<input
                [(ngModel)]="slot.callToActionTarget"
                name="callToActionTarget"
                class="ltr"
                placeholder="/products یا tel:... یا mailto:..."
            /></label>
            <label class="checkbox"
              ><input type="checkbox" [(ngModel)]="slot.isVisible" name="isVisible" /> نمایش در
              وب‌سایت</label
            >
          </div>
          @if (slotError()) {
            <p class="error" role="alert">{{ slotError() }}</p>
          }
          @if (slotSaved() === slot.key) {
            <p class="success">این بخش ذخیره شد.</p>
          }
          <div class="form-actions">
            <button type="submit" [disabled]="savingSlot()">ذخیره این بخش</button>
          </div>
        </form>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 56rem;
      }
      h1 {
        margin: 0 0 0.3rem;
        font-size: 1.6rem;
      }
      h2 {
        margin: 0 0 1rem;
        font-size: 1rem;
      }
      .lead {
        margin: 0 0 1.2rem;
        color: var(--color-text-muted);
        font-size: 0.85rem;
      }
      .panel {
        margin-block-end: 1.2rem;
        padding: 1.2rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-surface);
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
      label.checkbox {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        align-self: end;
      }
      input,
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
      .hint {
        color: var(--color-text-muted);
        font-size: 0.75rem;
        margin-block: 0.5rem 0;
      }
      .form-actions {
        margin-block-start: 0.8rem;
      }
      .form-actions button {
        padding: 0.6rem 1.2rem;
        border: 0;
        border-radius: 999px;
        background: var(--color-primary);
        color: var(--color-primary-contrast);
        font-weight: 700;
        cursor: pointer;
      }
      .error {
        padding: 0.6rem 0.9rem;
        border-inline-start: 2px solid var(--color-danger);
        background: rgb(255 154 171/8%);
        color: var(--color-danger);
        font-size: 0.8rem;
        border-radius: 0.4rem;
      }
      .success {
        color: var(--color-success);
        font-size: 0.8rem;
      }
      .slot-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin-block-end: 1rem;
      }
      .slot-tabs button {
        padding: 0.45rem 0.8rem;
        border: 1px solid var(--color-border);
        border-radius: 999px;
        background: transparent;
        color: var(--color-text-muted);
        font-size: 0.76rem;
        cursor: pointer;
      }
      .slot-tabs button.active {
        border-color: var(--color-primary);
        color: var(--color-text);
        background: rgb(139 212 255/8%);
      }
    `,
  ],
})
export class ContentEditorComponent {
  private readonly api = inject(AdminApiService);

  protected profileForm: BusinessProfile & { version: number } = {
    businessNameFa: '',
    representativeStatementFa: '',
    addressFa: '',
    phone: '',
    whatsApp: '',
    email: '',
    operatingHoursFa: '',
    version: 0,
  };
  protected readonly savingProfile = signal(false);
  protected readonly profileError = signal<string | null>(null);
  protected readonly profileSaved = signal(false);

  protected readonly slotForms = signal<SlotForm[]>(
    SLOTS.map((s) => ({
      key: s.key,
      label: s.label,
      titleFa: '',
      bodyFa: '',
      callToActionLabelFa: '',
      callToActionTarget: '',
      isVisible: true,
      version: 0,
    })),
  );
  protected readonly activeSlot = signal(SLOTS[0].key);
  protected readonly savingSlot = signal(false);
  protected readonly slotError = signal<string | null>(null);
  protected readonly slotSaved = signal<string | null>(null);

  constructor() {
    this.api.businessProfile().subscribe((profile) => {
      this.profileForm = {
        ...profile,
        addressFa: profile.addressFa ?? '',
        operatingHoursFa: profile.operatingHoursFa ?? '',
        version: profile.version ?? 0,
      };
    });
    this.api.managedContent().subscribe((entities) => {
      const byKey = new Map(entities.map((e) => [e.slotKey, e]));
      this.slotForms.set(
        SLOTS.map((s) => {
          const existing = byKey.get(s.key);
          return existing
            ? {
                key: s.key,
                label: s.label,
                titleFa: existing.titleFa,
                bodyFa: existing.bodyFa,
                callToActionLabelFa: existing.callToActionLabelFa ?? '',
                callToActionTarget: existing.callToActionTarget ?? '',
                isVisible: existing.isVisible,
                version: existing.version,
              }
            : {
                key: s.key,
                label: s.label,
                titleFa: '',
                bodyFa: '',
                callToActionLabelFa: '',
                callToActionTarget: '',
                isVisible: true,
                version: 0,
              };
        }),
      );
    });
  }

  protected currentSlot(): SlotForm | undefined {
    return this.slotForms().find((s) => s.key === this.activeSlot());
  }

  protected saveProfile(event: Event): void {
    event.preventDefault();
    this.savingProfile.set(true);
    this.profileSaved.set(false);
    const body: BusinessProfile = {
      ...this.profileForm,
      addressFa: this.profileForm.addressFa?.trim() || null,
      operatingHoursFa: this.profileForm.operatingHoursFa?.trim() || null,
    };
    this.api.updateBusinessProfile(body, this.profileForm.version).subscribe({
      next: (saved) => {
        this.savingProfile.set(false);
        this.profileError.set(null);
        this.profileSaved.set(true);
        this.profileForm = {
          ...saved,
          addressFa: saved.addressFa ?? '',
          operatingHoursFa: saved.operatingHoursFa ?? '',
          version: saved.version ?? 0,
        };
      },
      error: (error: unknown) => {
        this.savingProfile.set(false);
        this.profileError.set(readApiError(error).title);
      },
    });
  }

  protected saveSlot(event: Event, slot: SlotForm): void {
    event.preventDefault();
    this.savingSlot.set(true);
    this.slotSaved.set(null);
    const body = {
      titleFa: slot.titleFa.trim(),
      bodyFa: slot.bodyFa.trim(),
      callToActionLabelFa: slot.callToActionLabelFa.trim() || null,
      callToActionTarget: slot.callToActionTarget.trim() || null,
      isVisible: slot.isVisible,
    };
    this.api.updateManagedContent(slot.key, body, slot.version).subscribe({
      next: (saved) => {
        this.savingSlot.set(false);
        this.slotError.set(null);
        this.slotSaved.set(slot.key);
        this.slotForms.set(
          this.slotForms().map((s) => (s.key === slot.key ? { ...s, version: saved.version } : s)),
        );
      },
      error: (error: unknown) => {
        this.savingSlot.set(false);
        this.slotError.set(readApiError(error).title);
      },
    });
  }
}
