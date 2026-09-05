import { Routes } from '@angular/router';
import { adminGuard } from './core/auth/admin.guard';

export const routes: Routes = [
 {path:'',loadComponent:()=>import('./features/home/home.component').then(m=>m.HomeComponent),title:'نورستان | فروشگاه کالای برق'},
 {path:'products',loadComponent:()=>import('./features/catalog/catalog.component').then(m=>m.CatalogComponent),title:'محصولات | نورستان'},
 {path:'products/:slug',loadComponent:()=>import('./features/catalog/product-detail.component').then(m=>m.ProductDetailComponent),title:'جزئیات محصول | نورستان'},
 {path:'company',loadComponent:()=>import('./features/company/company.component').then(m=>m.CompanyComponent),title:'درباره نورستان'},
 {path:'contact',loadComponent:()=>import('./features/contact/contact.component').then(m=>m.ContactComponent),title:'تماس با نورستان'},
 {path:'admin/login',loadComponent:()=>import('./features/admin/auth/admin-login.component').then(m=>m.AdminLoginComponent),title:'ورود مدیریت | نورستان'},
 {path:'admin',canActivate:[adminGuard],loadChildren:()=>import('./features/admin/admin.routes').then(m=>m.ADMIN_ROUTES)},
 {path:'**',redirectTo:''},
];
