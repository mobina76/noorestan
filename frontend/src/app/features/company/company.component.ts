import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteStore } from '../../core/site/site.store';

@Component({
  selector: 'app-company',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <span>درباره ما</span>
      <h1>{{ site.site().businessNameFa }}</h1>
      <p>{{ site.site().representativeStatementFa }}</p>
    </header>
    <section>
      <article>
        <span>نگاه ما</span>
        <h2>انتخاب روشن، نتیجه ماندگار</h2>
        @if (intro(); as body) {
          <p>{{ body }}</p>
        } @else {
          <p>
            از تحلیل نیاز فضا تا بررسی ویژگی‌های فنی محصولات روشنایی مازی‌نور، هدف ما ساده‌کردن یک
            تصمیم فنی است.
          </p>
        }
        <p>
          قیمت و موجودی همواره از مسیر تماس مستقیم تأیید می‌شود؛ چون هر پروژه نیاز و زمان‌بندی ویژه
          خود را دارد.
        </p>
        @if (site.site().addressFa) {
          <p class="address"><b>نشانی:</b> {{ site.site().addressFa }}</p>
        }
        <a routerLink="/contact">گفت‌وگو با ما ←</a>
      </article>
    </section>
  `,
  styles: [
    `
      header {
        max-width: 78rem;
        margin: auto;
        padding: clamp(2rem, 4vw, 3.5rem) clamp(1rem, 4vw, 2.5rem) 1.5rem;
      }
      header span {
        color: var(--color-primary);
        font-size: 0.75rem;
      }
      h1 {
        margin: 0.5rem 0;
        font-size: clamp(1.8rem, 3.6vw, 2.6rem);
        line-height: 1.2;
        letter-spacing: -0.02em;
      }
      header p {
        max-width: 38rem;
        color: var(--color-text-muted);
      }
      section {
        max-width: 78rem;
        margin: auto;
        padding: 0 clamp(1rem, 4vw, 2.5rem) var(--space-section);
      }
      article {
        max-width: 42rem;
      }
      article > span {
        color: var(--color-primary);
        font-size: 0.75rem;
      }
      h2 {
        font-size: clamp(1.4rem, 2.6vw, 1.9rem);
        line-height: 1.25;
        letter-spacing: -0.015em;
        margin: 0.4rem 0 1rem;
      }
      article p {
        color: var(--color-text-muted);
        line-height: 1.85;
      }
      .address {
        color: var(--color-text);
      }
      article a {
        display: inline-block;
        margin-block-start: 1rem;
        color: var(--color-primary);
        text-decoration: none;
      }
    `,
  ],
})
export class CompanyComponent {
  protected readonly site = inject(SiteStore);
  protected readonly intro = computed(() => this.site.slot('company.intro')?.bodyFa);

  constructor() {
    this.site.load().subscribe();
  }
}
