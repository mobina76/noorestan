import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CategoryFilter,
  CategorySummary,
  Page,
  PublicProductDetail,
  PublicProductSummary,
  PublicSite,
} from './contracts';

export interface CatalogQuery {
  readonly q?: string;
  readonly category?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class PublicApiService {
  private readonly http = inject(HttpClient);

  categories(): Observable<ReadonlyArray<CategorySummary>> {
    return this.http.get<ReadonlyArray<CategorySummary>>('/api/v1/public/categories');
  }

  categoryFilters(slug: string): Observable<ReadonlyArray<CategoryFilter>> {
    return this.http.get<ReadonlyArray<CategoryFilter>>(`/api/v1/public/categories/${encodeURIComponent(slug)}/filters`);
  }

  products(query: CatalogQuery): Observable<Page<PublicProductSummary>> {
    let params = new HttpParams();
    if (query.q) params = params.set('q', query.q);
    if (query.category) params = params.set('category', query.category);
    params = params.set('page', String(query.page ?? 1));
    params = params.set('pageSize', String(query.pageSize ?? 24));
    return this.http.get<Page<PublicProductSummary>>('/api/v1/public/products', { params });
  }

  product(slug: string): Observable<PublicProductDetail> {
    return this.http.get<PublicProductDetail>(`/api/v1/public/products/${encodeURIComponent(slug)}`);
  }

  site(): Observable<PublicSite> {
    return this.http.get<PublicSite>('/api/v1/public/site');
  }
}
