import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../core/api/api.config';
import {
  TutorAlumno,
  TutorAlumnoCreateRequest,
  TutorAlumnoImportResult,
} from './tutor-alumnos.models';

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

  createAlumno(request: TutorAlumnoCreateRequest): Observable<TutorAlumno> {
    return this.withAuth((headers) =>
      this.http.post<TutorAlumno>(`${this.apiBaseUrl}/tutor/alumnos`, request, { headers }),
    );
  }

  downloadImportTemplate(): Observable<Blob> {
    return this.withAuth((headers) =>
      this.http.get(`${this.apiBaseUrl}/tutor/alumnos/import-template`, {
        headers,
        responseType: 'blob',
      }),
    );
  }

  importAlumnos(file: File): Observable<TutorAlumnoImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.withAuth((headers) =>
      this.http.post<TutorAlumnoImportResult>(
        `${this.apiBaseUrl}/tutor/alumnos/import`,
        formData,
        { headers },
      ),
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
