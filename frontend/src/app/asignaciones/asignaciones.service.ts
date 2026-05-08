import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../core/api/api.config';
import { AsignacionCandidata, AsignacionCreatePayload, AsignacionFct } from './asignaciones.models';

@Injectable({ providedIn: 'root' })
export class AsignacionesService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiBaseUrl = withoutTrailingSlash(inject(API_BASE_URL));

  list(): Observable<AsignacionFct[]> {
    return this.withAuth((headers) =>
      this.http.get<AsignacionFct[]>(this.baseUrl(), { headers }),
    );
  }

  listCandidatas(): Observable<AsignacionCandidata[]> {
    return this.withAuth((headers) =>
      this.http.get<AsignacionCandidata[]>(`${this.baseUrl()}/candidatas`, { headers }),
    );
  }

  create(payload: AsignacionCreatePayload): Observable<AsignacionFct> {
    return this.withAuth((headers) =>
      this.http.post<AsignacionFct>(this.baseUrl(), payload, { headers }),
    );
  }

  private baseUrl(): string {
    return `${this.apiBaseUrl}/asignaciones`;
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
