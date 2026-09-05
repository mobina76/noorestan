import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicProductSummary } from '../core/api/contracts';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<a class="card" [routerLink]="['/products', product().slug]">
  <div class="visual">
    @if (product().primaryImage; as image) {
      <img [src]="image.url" [alt]="image.altTextFa" loading="lazy" width="320" height="240">
    } @else {
      <span class="placeholder" aria-hidden="true">نورستان</span>
    }
    @if (product().mazinoorProductCode) { <small>{{ product().mazinoorProductCode }}</small> }
  </div>
  <div class="body">
    <span>{{ product().category }}</span>
    <h3>{{ product().nameFa }}</h3>
    <p>{{ product().shortDescriptionFa }}</p>
  </div>
</a>`,
  styles: [`
    :host{display:block;height:100%}
    .card{display:flex;flex-direction:column;height:100%;overflow:hidden;border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface);color:var(--color-text);text-decoration:none;transition:border-color var(--duration-base),box-shadow var(--duration-base)}
    .card:hover{border-color:color-mix(in srgb,var(--color-primary) 55%,var(--color-border));box-shadow:0 0 0 1px color-mix(in srgb,var(--color-primary) 25%,transparent)}
    .visual{position:relative;aspect-ratio:4/3;overflow:hidden;background:var(--color-bg-elevated);display:grid;place-items:center}
    .visual img{width:100%;height:100%;object-fit:cover;transition:transform var(--duration-base)}
    .card:hover .visual img{transform:scale(1.03)}
    .placeholder{color:var(--color-text-muted);font-size:.85rem}
    .visual small{position:absolute;inset-inline-start:.6rem;inset-block-end:.5rem;padding:.1rem .45rem;border-radius:.3rem;background:rgb(5 9 18/70%);color:var(--color-text-muted);font-family:monospace;direction:ltr;font-size:.68rem}
    .body{padding:.85rem .95rem 1rem;display:flex;flex-direction:column;gap:.15rem}
    .body>span{color:var(--color-primary);font-size:.7rem}
    .body h3{margin:0;font-size:1.02rem;line-height:1.35}
    .body p{margin:.15rem 0 0;color:var(--color-text-muted);font-size:.8rem;line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  `],
})
export class ProductCardComponent {
  readonly product = input.required<PublicProductSummary>();
}
