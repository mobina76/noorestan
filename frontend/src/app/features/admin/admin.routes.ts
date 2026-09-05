import { Routes } from '@angular/router';
import { ownerGuard } from '../../core/auth/admin.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-shell.component').then((m) => m.AdminShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
        title: 'داشبورد | مدیریت نورستان',
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./products/product-list.component').then((m) => m.ProductListComponent),
        title: 'محصولات | مدیریت نورستان',
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('./products/product-editor.component').then((m) => m.ProductEditorComponent),
        title: 'محصول جدید | مدیریت نورستان',
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./products/product-editor.component').then((m) => m.ProductEditorComponent),
        title: 'ویرایش محصول | مدیریت نورستان',
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./categories/category-list.component').then((m) => m.CategoryListComponent),
        title: 'دسته‌بندی‌ها | مدیریت نورستان',
      },
      {
        path: 'content',
        loadComponent: () =>
          import('./content/content-editor.component').then((m) => m.ContentEditorComponent),
        title: 'محتوای سایت | مدیریت نورستان',
      },
      {
        path: 'accounts',
        canActivate: [ownerGuard],
        loadComponent: () =>
          import('./accounts/account-list.component').then((m) => m.AccountListComponent),
        title: 'حساب‌های مدیریت | مدیریت نورستان',
      },
    ],
  },
];
