import { Routes } from '@angular/router';
export const routes:Routes=[
 {path:'',loadComponent:()=>import('./features/home/home.component').then(m=>m.HomeComponent),title:'نورستان | روشنایی برای معماری'},
 {path:'products',loadComponent:()=>import('./features/catalog/catalog.component').then(m=>m.CatalogComponent),title:'محصولات | نورستان'},
 {path:'products/:slug',loadComponent:()=>import('./features/catalog/product-detail.component').then(m=>m.ProductDetailComponent),title:'جزئیات محصول | نورستان'},
 {path:'company',loadComponent:()=>import('./features/company/company.component').then(m=>m.CompanyComponent),title:'درباره نورستان'},
 {path:'contact',loadComponent:()=>import('./features/contact/contact.component').then(m=>m.ContactComponent),title:'تماس با نورستان'},
 {path:'admin',loadComponent:()=>import('./features/admin/admin.component').then(m=>m.AdminComponent),title:'مدیریت نورستان'},
 {path:'**',redirectTo:''},
];
