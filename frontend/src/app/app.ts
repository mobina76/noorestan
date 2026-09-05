import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SiteStore } from './core/site/site.store';

@Component({ selector: 'app-root', imports: [RouterOutlet, RouterLink, RouterLinkActive], changeDetection: ChangeDetectionStrategy.OnPush, templateUrl: './app.html', styleUrl: './app.css' })
export class App {
  private readonly router = inject(Router);
  protected readonly menuOpen = signal(false);
  protected readonly year = new Date().getFullYear();
  protected readonly site = inject(SiteStore);
  private readonly currentUrl = signal(this.router.url);
  protected readonly isAdminRoute = computed(() => this.currentUrl().startsWith('/admin'));

  constructor() {
    this.site.load().subscribe();
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => this.currentUrl.set((event as NavigationEnd).urlAfterRedirects));
  }
}
