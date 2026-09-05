import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AdminCategory,
  AdminProductDetail,
  AdminProductImage,
  AdminSpecificationDefinition,
  AdministratorAccountDto,
  BusinessProfile,
  CategoryWrite,
  ManagedContentEntity,
  ManagedContentWrite,
  Page,
  AdminProductSummary,
  ProductStatus,
  ProductWrite,
  SpecificationDefinitionWrite,
  SpecificationValueWrite,
} from './contracts';

function ifMatch(version: number) {
  return { headers: { 'If-Match': `"${version}"` } };
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);

  // Categories
  categories(): Observable<ReadonlyArray<AdminCategory>> {
    return this.http.get<ReadonlyArray<AdminCategory>>('/api/v1/admin/categories');
  }
  createCategory(body: CategoryWrite): Observable<AdminCategory> {
    return this.http.post<AdminCategory>('/api/v1/admin/categories', body);
  }
  updateCategory(id: string, body: CategoryWrite, version: number): Observable<AdminCategory> {
    return this.http.put<AdminCategory>(`/api/v1/admin/categories/${id}`, body, ifMatch(version));
  }
  deleteCategory(id: string, version: number): Observable<void> {
    return this.http.delete<void>(`/api/v1/admin/categories/${id}`, ifMatch(version));
  }

  // Specification definitions
  specifications(categoryId: string): Observable<ReadonlyArray<AdminSpecificationDefinition>> {
    return this.http.get<ReadonlyArray<AdminSpecificationDefinition>>(`/api/v1/admin/categories/${categoryId}/specifications`);
  }
  createSpecification(categoryId: string, body: SpecificationDefinitionWrite): Observable<AdminSpecificationDefinition> {
    return this.http.post<AdminSpecificationDefinition>(`/api/v1/admin/categories/${categoryId}/specifications`, body);
  }
  updateSpecification(categoryId: string, id: string, body: SpecificationDefinitionWrite, version: number): Observable<AdminSpecificationDefinition> {
    return this.http.put<AdminSpecificationDefinition>(`/api/v1/admin/categories/${categoryId}/specifications/${id}`, body, ifMatch(version));
  }
  deleteSpecification(categoryId: string, id: string, version: number): Observable<void> {
    return this.http.delete<void>(`/api/v1/admin/categories/${categoryId}/specifications/${id}`, ifMatch(version));
  }

  // Products
  products(params: { status?: ProductStatus; categoryId?: string; q?: string; page?: number; pageSize?: number }): Observable<Page<AdminProductSummary>> {
    let httpParams = new HttpParams();
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.categoryId) httpParams = httpParams.set('categoryId', params.categoryId);
    if (params.q) httpParams = httpParams.set('q', params.q);
    httpParams = httpParams.set('page', String(params.page ?? 1));
    httpParams = httpParams.set('pageSize', String(params.pageSize ?? 20));
    return this.http.get<Page<AdminProductSummary>>('/api/v1/admin/products', { params: httpParams });
  }
  product(id: string): Observable<AdminProductDetail> {
    return this.http.get<AdminProductDetail>(`/api/v1/admin/products/${id}`);
  }
  createProduct(body: ProductWrite): Observable<AdminProductDetail> {
    return this.http.post<AdminProductDetail>('/api/v1/admin/products', body);
  }
  updateProduct(id: string, body: ProductWrite, version: number): Observable<AdminProductDetail> {
    return this.http.put<AdminProductDetail>(`/api/v1/admin/products/${id}`, body, ifMatch(version));
  }
  changeStatus(id: string, targetStatus: ProductStatus, version: number): Observable<AdminProductDetail> {
    return this.http.post<AdminProductDetail>(`/api/v1/admin/products/${id}/status`, { targetStatus }, ifMatch(version));
  }
  updateSpecificationValues(id: string, values: ReadonlyArray<SpecificationValueWrite>, version: number): Observable<void> {
    return this.http.put<void>(`/api/v1/admin/products/${id}/specifications`, { values }, ifMatch(version));
  }
  deleteProduct(id: string, version: number): Observable<void> {
    return this.http.delete<void>(`/api/v1/admin/products/${id}`, { ...ifMatch(version), headers: { ...ifMatch(version).headers, confirmation: 'permanently-delete' } });
  }

  // Images
  uploadImage(productId: string, file: File, altTextFa: string): Observable<AdminProductImage> {
    const form = new FormData();
    form.append('file', file);
    form.append('altTextFa', altTextFa);
    return this.http.post<AdminProductImage>(`/api/v1/admin/products/${productId}/images`, form);
  }
  reorderImages(productId: string, orderedImageIds: ReadonlyArray<string>): Observable<void> {
    return this.http.put<void>(`/api/v1/admin/products/${productId}/images/order`, { orderedImageIds });
  }
  setPrimaryImage(productId: string, imageId: string): Observable<void> {
    return this.http.post<void>(`/api/v1/admin/products/${productId}/images/${imageId}/primary`, {});
  }
  updateImageAltText(productId: string, imageId: string, altTextFa: string): Observable<void> {
    return this.http.put<void>(`/api/v1/admin/products/${productId}/images/${imageId}`, { altTextFa });
  }
  removeImage(productId: string, imageId: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/admin/products/${productId}/images/${imageId}`);
  }

  // Site content
  businessProfile(): Observable<BusinessProfile> {
    return this.http.get<BusinessProfile>('/api/v1/admin/site/profile');
  }
  updateBusinessProfile(body: BusinessProfile, version: number): Observable<BusinessProfile> {
    return this.http.put<BusinessProfile>('/api/v1/admin/site/profile', body, ifMatch(version));
  }
  managedContent(): Observable<ReadonlyArray<ManagedContentEntity>> {
    return this.http.get<ReadonlyArray<ManagedContentEntity>>('/api/v1/admin/site/content');
  }
  updateManagedContent(slotKey: string, body: ManagedContentWrite, version: number): Observable<ManagedContentEntity> {
    return this.http.put<ManagedContentEntity>(`/api/v1/admin/site/content/${slotKey}`, body, ifMatch(version));
  }

  // Owner-only accounts
  accounts(): Observable<ReadonlyArray<AdministratorAccountDto>> {
    return this.http.get<ReadonlyArray<AdministratorAccountDto>>('/api/v1/owner/accounts');
  }
  createAccount(body: { displayName: string; email: string; temporaryPassword: string }): Observable<AdministratorAccountDto> {
    return this.http.post<AdministratorAccountDto>('/api/v1/owner/accounts', body);
  }
  deactivateAccount(id: string): Observable<void> {
    return this.http.post<void>(`/api/v1/owner/accounts/${id}/deactivate`, {});
  }
  transferOwnership(newOwnerId: string): Observable<void> {
    return this.http.post<void>('/api/v1/owner/transfer', { newOwnerId });
  }
}
