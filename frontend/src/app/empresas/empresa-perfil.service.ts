import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../core/api/api.config';
import { EmpresaPerfil, EmpresaPerfilRequest } from './empresa-perfil.models';

@Injectable({ providedIn: 'root' })
export class EmpresaPerfilService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiBaseUrl = withoutTrailingSlash(inject(API_BASE_URL));

  getMine(): Observable<EmpresaPerfil> {
    return this.withAuth((headers) =>
      this.http.get<EmpresaPerfil>(this.baseUrl(), { headers }),
    );
  }

  updateMine(request: EmpresaPerfilRequest): Observable<EmpresaPerfil> {
    return this.withAuth((headers) =>
      this.http.put<EmpresaPerfil>(this.baseUrl(), request, { headers }),
    );
  }

  private baseUrl(): string {
    return `${this.apiBaseUrl}/empresas/me`;
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
