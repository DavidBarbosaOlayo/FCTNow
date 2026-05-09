import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../core/api/api.config';
import {
  AsignacionExternaCandidata,
  AsignacionExternaCreatePayload,
  AsignacionFctExterna,
} from './asignaciones-externas.models';

@Injectable({ providedIn: 'root' })
export class AsignacionesExternasService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiBaseUrl = withoutTrailingSlash(inject(API_BASE_URL));

  list(): Observable<AsignacionFctExterna[]> {
    return this.withAuth((headers) =>
      this.http.get<AsignacionFctExterna[]>(this.baseUrl(), { headers }),
    );
  }

  listCandidatas(): Observable<AsignacionExternaCandidata[]> {
    return this.withAuth((headers) =>
      this.http.get<AsignacionExternaCandidata[]>(`${this.baseUrl()}/candidatas`, { headers }),
    );
  }

  create(payload: AsignacionExternaCreatePayload): Observable<AsignacionFctExterna> {
    return this.withAuth((headers) =>
      this.http.post<AsignacionFctExterna>(this.baseUrl(), payload, { headers }),
    );
  }

  private baseUrl(): string {
    return `${this.apiBaseUrl}/asignaciones/externas`;
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
