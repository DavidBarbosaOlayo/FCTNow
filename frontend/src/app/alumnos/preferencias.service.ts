import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../core/api/api.config';
import { AlumnoPreferencias, AlumnoPreferenciasRequest } from './preferencias.models';

@Injectable({ providedIn: 'root' })
export class AlumnoPreferenciasService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiBaseUrl = withoutTrailingSlash(inject(API_BASE_URL));

  getMine(): Observable<AlumnoPreferencias> {
    return this.withAuth((headers) =>
      this.http.get<AlumnoPreferencias>(`${this.baseUrl()}/preferencias`, { headers }),
    );
  }

  updateMine(request: AlumnoPreferenciasRequest): Observable<AlumnoPreferencias> {
    return this.withAuth((headers) =>
      this.http.put<AlumnoPreferencias>(`${this.baseUrl()}/preferencias`, request, { headers }),
    );
  }

  uploadCv(file: File): Observable<AlumnoPreferencias> {
    const body = new FormData();
    body.append('file', file);

    return this.withAuth((headers) =>
      this.http.put<AlumnoPreferencias>(`${this.baseUrl()}/cv`, body, { headers }),
    );
  }

  uploadPhoto(file: File): Observable<AlumnoPreferencias> {
    const body = new FormData();
    body.append('file', file);

    return this.withAuth((headers) =>
      this.http.put<AlumnoPreferencias>(`${this.baseUrl()}/foto`, body, { headers }),
    );
  }

  downloadCv(): Observable<Blob> {
    return this.withAuth((headers) =>
      this.http.get(`${this.baseUrl()}/cv`, { headers, responseType: 'blob' }),
    );
  }

  private baseUrl(): string {
    return `${this.apiBaseUrl}/alumnos/me`;
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
