import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../core/api/api.config';
import {
  SolicitudExterna,
  SolicitudExternaCreatePayload,
  SolicitudExternaEstado,
} from './solicitudes-externas.models';

@Injectable({ providedIn: 'root' })
export class SolicitudesExternasService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiBaseUrl = withoutTrailingSlash(inject(API_BASE_URL));

  mine(): Observable<SolicitudExterna[]> {
    return this.withAuth((headers) =>
      this.http.get<SolicitudExterna[]>(this.baseUrl(), { headers }),
    );
  }

  create(payload: SolicitudExternaCreatePayload): Observable<SolicitudExterna> {
    return this.withAuth((headers) =>
      this.http.post<SolicitudExterna>(this.baseUrl(), payload, { headers }),
    );
  }

  changeEstado(id: number, estado: SolicitudExternaEstado): Observable<SolicitudExterna> {
    return this.withAuth((headers) =>
      this.http.patch<SolicitudExterna>(
        `${this.baseUrl()}/${id}/estado`,
        { estado },
        { headers },
      ),
    );
  }

  private baseUrl(): string {
    return `${this.apiBaseUrl}/alumno/solicitudes-externas`;
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
