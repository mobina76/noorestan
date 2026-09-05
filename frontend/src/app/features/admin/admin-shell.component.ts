import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionStore } from '../../core/auth/session.store';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell">
      <header class="topbar">
        <button type="button" class="menu-toggle" (click)="navOpen.set(!navOpen())" [attr.aria-expanded]="navOpen()" aria-controls="admin-nav">
          <span class="sr-only">نمایش فهرست مدیریت</span><span></span><span></span>
        </button>
        <a routerLink="/admin" class="brand">مدیریت نورستان</a>
        <div class="user">
          <span>{{ session()?.displayName }}</span>
          @if (session()?.isOwner) { <span class="owner-badge">مالک</span> }
          <button type="button" (click)="logout()">خروج</button>
        </div>
      </header>
      <div class="body">
        <nav id="admin-nav" class="side-nav" [class.open]="navOpen()" aria-label="ناوبری مدیریت">
          <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">داشبورد</a>
          <a routerLink="/admin/products" routerLinkActive="active">محصولات</a>
          <a routerLink="/admin/categories" routerLinkActive="active">دسته‌بندی‌ها</a>
          <a routerLink="/admin/content" routerLinkActive="active">محتوای سایت</a>
          @if (session()?.isOwner) {
            <a routerLink="/admin/accounts" routerLinkActive="active">حساب‌های مدیریت</a>
          }
          <a routerLink="/" class="back-link">بازگشت به وب‌سایت ↩</a>
        </nav>
        <main class="content"><router-outlet /></main>
      </div>
    </div>
  `,
  styles: [`
    :host{display:block;min-height:100vh;background:var(--color-bg-elevated)}
    .shell{display:flex;flex-direction:column;min-height:100vh}
    .topbar{display:flex;align-items:center;gap:1rem;padding:.7rem 1.2rem;border-block-end:1px solid var(--color-border);background:var(--color-surface);position:sticky;inset-block-start:0;z-index:10}
    .menu-toggle{display:none;flex-direction:column;gap:.25rem;width:2rem;height:2rem;border:1px solid var(--color-border);border-radius:.5rem;background:transparent;padding:.4rem}
    .menu-toggle span{display:block;height:2px;background:var(--color-text-muted);border-radius:1px}
    .brand{color:var(--color-text);font-weight:800;text-decoration:none;font-size:.95rem}
    .user{display:flex;align-items:center;gap:.6rem;margin-inline-start:auto;color:var(--color-text-muted);font-size:.8rem}
    .owner-badge{padding:.15rem .5rem;border:1px solid var(--color-primary);border-radius:999px;color:var(--color-primary);font-size:.68rem}
    .user button{padding:.4rem .8rem;border:1px solid var(--color-border);border-radius:.6rem;background:transparent;color:var(--color-text);cursor:pointer}
    .body{display:flex;flex:1;min-height:0}
    .side-nav{display:flex;flex-direction:column;gap:.2rem;width:14rem;flex:none;padding:1rem .8rem;border-inline-end:1px solid var(--color-border);background:var(--color-surface)}
    .side-nav a{padding:.6rem .8rem;border-radius:.6rem;color:var(--color-text-muted);text-decoration:none;font-size:.85rem}
    .side-nav a:hover{background:rgb(139 212 255/6%);color:var(--color-text)}
    .side-nav a.active{background:rgb(139 212 255/10%);color:var(--color-text);font-weight:700}
    .back-link{margin-block-start:1rem;border-block-start:1px solid var(--color-border);padding-block-start:1rem!important}
    .content{flex:1;min-width:0;padding:1.5rem clamp(1rem,3vw,2rem)}
    .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
    @media (max-width: 60rem){
      .menu-toggle{display:flex}
      .side-nav{position:fixed;inset-block:3.2rem 0;inset-inline-start:-16rem;z-index:9;transition:inset-inline-start var(--duration-base);box-shadow:var(--shadow-surface)}
      .side-nav.open{inset-inline-start:0}
      .content{padding:1rem}
    }
  `],
})
export class AdminShellComponent {
  private readonly sessionStore = inject(SessionStore);
  private readonly router = inject(Router);
  protected readonly session = this.sessionStore.session;
  protected readonly navOpen = signal(false);

  protected logout(): void {
    this.sessionStore.logout().subscribe(() => this.router.navigateByUrl('/admin/login'));
  }
}
