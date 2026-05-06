import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../core/api/api.config';
import { SolicitudFct } from './solicitudes.models';

@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiBaseUrl = withoutTrailingSlash(inject(API_BASE_URL));

  mine(): Observable<SolicitudFct[]> {
    const headers = this.authHeaders();

    if (!headers) {
      return throwError(() => new Error('No hay una sesion activa.'));
    }

    return this.http.get<SolicitudFct[]>(`${this.apiBaseUrl}/solicitudes/me`, { headers });
  }

  requestOffer(ofertaId: number): Observable<SolicitudFct> {
    const headers = this.authHeaders();

    if (!headers) {
      return throwError(() => new Error('No hay una sesion activa.'));
    }

    return this.http.post<SolicitudFct>(
      `${this.apiBaseUrl}/ofertas/${ofertaId}/solicitudes`,
      {},
      { headers },
    );
  }

  private authHeaders(): HttpHeaders | null {
    const accessToken = this.authService.accessToken();

    return accessToken ? new HttpHeaders({ Authorization: `Bearer ${accessToken}` }) : null;
  }
}

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/$/, '');
}
