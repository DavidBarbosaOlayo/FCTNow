import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../core/api/api.config';
import { TutorAlumno } from './tutor-alumnos.models';

@Injectable({ providedIn: 'root' })
export class TutorAlumnosService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiBaseUrl = withoutTrailingSlash(inject(API_BASE_URL));

  list(): Observable<TutorAlumno[]> {
    return this.withAuth((headers) =>
      this.http.get<TutorAlumno[]>(`${this.apiBaseUrl}/tutor/alumnos`, { headers }),
    );
  }

  downloadCv(alumnoId: number): Observable<Blob> {
    return this.withAuth((headers) =>
      this.http.get(`${this.apiBaseUrl}/tutor/alumnos/${alumnoId}/cv`, {
        headers,
        responseType: 'blob',
      }),
    );
  }

  private withAuth<T>(builder: (headers: HttpHeaders) => Observable<T>): Observable<T> {
    const token = this.authService.accessToken();
    if (!token) {
      return throwError(() => new Error('No hay una sesion activa.'));
    }
    return builder(new HttpHeaders({ Authorization: `Bearer ${token}` }));
  }
}

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/$/, '');
}
