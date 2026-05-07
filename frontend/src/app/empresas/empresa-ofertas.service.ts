import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../core/api/api.config';
import { OfertaEstado, OfertaFct } from '../practicas/ofertas.models';
import { OfertaFctRequest } from './empresa-ofertas.models';

@Injectable({ providedIn: 'root' })
export class EmpresaOfertasService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiBaseUrl = withoutTrailingSlash(inject(API_BASE_URL));

  listMine(): Observable<OfertaFct[]> {
    return this.withAuth((headers) =>
      this.http.get<OfertaFct[]>(this.baseUrl(), { headers }),
    );
  }

  detail(id: number): Observable<OfertaFct> {
    return this.withAuth((headers) =>
      this.http.get<OfertaFct>(`${this.baseUrl()}/${id}`, { headers }),
    );
  }

  create(request: OfertaFctRequest): Observable<OfertaFct> {
    return this.withAuth((headers) =>
      this.http.post<OfertaFct>(this.baseUrl(), request, { headers }),
    );
  }

  update(id: number, request: OfertaFctRequest): Observable<OfertaFct> {
    return this.withAuth((headers) =>
      this.http.put<OfertaFct>(`${this.baseUrl()}/${id}`, request, { headers }),
    );
  }

  changeEstado(id: number, estado: OfertaEstado): Observable<OfertaFct> {
    return this.withAuth((headers) =>
      this.http.patch<OfertaFct>(
        `${this.baseUrl()}/${id}/estado`,
        { estado },
        { headers },
      ),
    );
  }

  delete(id: number): Observable<void> {
    return this.withAuth((headers) =>
      this.http.delete<void>(`${this.baseUrl()}/${id}`, { headers }),
    );
  }

  private baseUrl(): string {
    return `${this.apiBaseUrl}/empresas/me/ofertas`;
  }

  private withAuth<T>(builder: (headers: HttpHeaders) => Observable<T>): Observable<T> {
    const accessToken = this.authService.accessToken();
    if (!accessToken) {
      return throwError(() => new Error('No hay una sesion activa.'));
    }
    return builder(new HttpHeaders({ Authorization: `Bearer ${accessToken}` }));
  }
}

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/$/, '');
}
