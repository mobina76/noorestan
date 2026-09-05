import { Injectable, computed, inject, signal } from '@angular/core';
import { shareReplay, tap } from 'rxjs';
import { PublicApiService } from '../api/public-api.service';
import { ManagedContentSlot, PhoneNumber, PublicSite } from '../api/contracts';

const FALLBACK: PublicSite = {
  businessNameFa: 'نورستان',
  representativeStatementFa: 'نماینده فروش محصولات مازی‌نور',
  phones: [],
  whatsApp: '',
  email: '',
  addressFa: null,
  content: [],
};

@Injectable({ providedIn: 'root' })
export class SiteStore {
  private readonly api = inject(PublicApiService);
  readonly site = signal<PublicSite>(FALLBACK);
  readonly phones = computed(() => this.site().phones);
  readonly hasPhones = computed(() => this.site().phones.length > 0);
  // The number used for a single quick "call us" action (e.g. a product-detail CTA): the first
  // line that isn't also a fax number, falling back to the first line if every one doubles as fax.
  readonly primaryPhone = computed<PhoneNumber | undefined>(
    () => this.site().phones.find((p) => !p.isAlsoFax) ?? this.site().phones[0],
  );
  readonly hasWhatsApp = computed(() => this.site().whatsApp.trim().length > 0);
  readonly hasEmail = computed(() => this.site().email.trim().length > 0);

  private readonly request$ = this.api.site().pipe(
    tap((site) => this.site.set(site)),
    shareReplay(1),
  );

  load() {
    return this.request$;
  }

  slot(key: string): ManagedContentSlot | undefined {
    return this.site().content.find((c) => c.slotKey === key);
  }

  whatsAppLink(message: string): string {
    const number = this.site().whatsApp.replace(/[^0-9]/g, '');
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }

  telLink(number: string): string {
    return `tel:${number.replace(/[^\d+]/g, '')}`;
  }

  mailLink(subject: string): string {
    return `mailto:${this.site().email}?subject=${encodeURIComponent(subject)}`;
  }
}
