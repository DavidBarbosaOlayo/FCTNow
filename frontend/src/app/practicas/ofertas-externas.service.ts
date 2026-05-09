import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../core/api/api.config';
import {
  OfertaExternaFilters,
  OfertaExternaPage,
} from './ofertas-externas.models';

@Injectable({ providedIn: 'root' })
export class OfertasExternasService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiBaseUrl = withoutTrailingSlash(inject(API_BASE_URL));

  list(filters: OfertaExternaFilters = {}): Observable<OfertaExternaPage> {
    const params = buildParams(filters);
    const headers = this.authHeaders();

    return this.http.get<OfertaExternaPage>(
      `${this.apiBaseUrl}/ofertas/externas`,
      headers ? { params, headers } : { params },
    );
  }

  private authHeaders(): HttpHeaders | null {
    const accessToken = this.authService.accessToken();

    return accessToken ? new HttpHeaders({ Authorization: `Bearer ${accessToken}` }) : null;
  }
}

function buildParams(filters: OfertaExternaFilters): HttpParams {
  let params = new HttpParams();
  params = appendTrimmed(params, 'q', filters.q);
  params = appendTrimmed(params, 'where', filters.where);
  params = appendTrimmed(params, 'category', filters.category);
  if (filters.page != null) {
    params = params.set('page', String(filters.page));
  }
  if (filters.resultsPerPage != null) {
    params = params.set('resultsPerPage', String(filters.resultsPerPage));
  }
  return params;
}

function appendTrimmed(params: HttpParams, name: string, value: string | undefined): HttpParams {
  const normalized = value?.trim();
  return normalized ? params.set(name, normalized) : params;
}

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/$/, '');
}
