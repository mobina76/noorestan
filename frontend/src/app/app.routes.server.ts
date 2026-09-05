import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'admin/**',
    renderMode: RenderMode.Client
  },
  {
    // Home, catalog, product detail, company, and contact all read live
    // administrator-managed data, so they are rendered per request rather
    // than prerendered as static snapshots at build time.
    path: '**',
    renderMode: RenderMode.Server
  }
];
