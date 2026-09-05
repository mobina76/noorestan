import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SiteStore } from '../../core/site/site.store';

@Component({
  selector: 'app-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<section>
  <div>
    <span>تماس با ما</span>
    <h1>گفت‌وگوی شما، شروع یک راه‌حل روشن</h1>
    <p>برای مشاوره انتخاب محصول، استعلام قیمت، بررسی موجودی و ثبت سفارش مستقیم با {{ site.site().businessNameFa }} تماس بگیرید.</p>
    @if (site.site().addressFa) { <p class="address"><b>نشانی:</b> {{ site.site().addressFa }}</p> }
  </div>
  <div class="cards">
    @if (site.hasPhone()) { <a [href]="site.telLink()"><small>تماس تلفنی</small><b class="ltr">{{ site.site().phone }}</b><i>←</i></a> }
    @if (site.hasWhatsApp()) { <a [href]="site.whatsAppLink('سلام، می‌خواستم درباره محصولات نورستان اطلاعات بگیرم.')"><small>واتساپ</small><b>ارسال پیام مستقیم</b><i>←</i></a> }
    @if (site.hasEmail()) { <a [href]="site.mailLink('استعلام از نورستان')"><small>پست الکترونیک</small><b class="ltr">{{ site.site().email }}</b><i>←</i></a> }
    @if (!site.hasPhone() && !site.hasWhatsApp() && !site.hasEmail()) {
      <p class="muted">اطلاعات تماس به‌زودی از سوی مدیریت نورستان تکمیل می‌شود.</p>
    }
    <article><small>یادآوری</small><p>{{ notice() }}</p></article>
  </div>
</section>
`,
  styles: [`
section{display:grid;grid-template-columns:1fr 1fr;gap:clamp(2rem,6vw,5rem);max-width:78rem;min-height:60vh;margin:auto;padding:clamp(2.5rem,5vw,4.5rem) clamp(1rem,4vw,2.5rem)}
span{color:var(--color-primary);font-size:.75rem}
h1{margin:.7rem 0;font-size:clamp(1.8rem,3.4vw,2.4rem);line-height:1.25;letter-spacing:-.02em}
section>div>p{max-width:36rem;color:var(--color-text-muted)}
.address{color:var(--color-text)}
.cards{align-self:center}
.cards>a,.cards article{position:relative;display:block;padding:1.1rem;border-block-start:1px solid var(--color-border);color:var(--color-text);text-decoration:none}
.cards>a:hover{background:rgb(139 212 255/5%)}
.cards small{display:block;color:var(--color-text-muted);font-size:.7rem}
.cards b{font-size:1.05rem}
.cards b.ltr{direction:ltr;display:block;text-align:start}
.cards i{position:absolute;inset:50% auto auto 1rem;color:var(--color-primary);font-style:normal}
.cards article{margin-block-start:1.5rem;border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface)}
.cards article p{margin:.4rem 0 0;color:var(--color-text-muted);font-size:.8rem}
.muted{color:var(--color-text-muted);font-size:.85rem;padding-block:1rem}
@media(max-width:48rem){section{grid-template-columns:1fr}}
`],
})
export class ContactComponent {
  protected readonly site = inject(SiteStore);
  protected readonly notice = computed(() =>
    this.site.slot('contact.notice')?.bodyFa
    ?? 'فروش آنلاین در این وب‌سایت انجام نمی‌شود. قیمت، موجودی و سفارش محصولات از طریق تماس مستقیم هماهنگ خواهد شد.');

  constructor() {
    this.site.load().subscribe();
  }
}
