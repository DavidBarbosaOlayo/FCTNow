import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../core/api/api.config';
import { AlumnoAsignacionActual } from './asignacion-actual.models';

@Injectable({ providedIn: 'root' })
export class AlumnoAsignacionActualService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiBaseUrl = withoutTrailingSlash(inject(API_BASE_URL));

  getMine(): Observable<AlumnoAsignacionActual | null> {
    const accessToken = this.authService.accessToken();

    if (!accessToken) {
      return throwError(() => new Error('No hay una sesion activa de alumno.'));
    }

    return this.http.get<AlumnoAsignacionActual | null>(
      `${this.apiBaseUrl}/alumnos/me/asignacion`,
      {
        headers: new HttpHeaders({ Authorization: `Bearer ${accessToken}` }),
      },
    );
  }
}

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/$/, '');
}
