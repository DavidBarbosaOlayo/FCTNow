import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../core/api/api.config';
import { SolicitudEstado } from '../practicas/solicitudes.models';
import { EmpresaSolicitud } from './empresa-solicitudes.models';

@Injectable({ providedIn: 'root' })
export class EmpresaSolicitudesService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiBaseUrl = withoutTrailingSlash(inject(API_BASE_URL));

  listMine(): Observable<EmpresaSolicitud[]> {
    return this.withAuth((headers) =>
      this.http.get<EmpresaSolicitud[]>(this.baseUrl(), { headers }),
    );
  }

  changeEstado(id: number, estado: SolicitudEstado): Observable<EmpresaSolicitud> {
    return this.withAuth((headers) =>
      this.http.patch<EmpresaSolicitud>(
        `${this.baseUrl()}/${id}/estado`,
        { estado },
        { headers },
      ),
    );
  }

  private baseUrl(): string {
    return `${this.apiBaseUrl}/empresas/me/solicitudes`;
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
