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
    const token = this.authService.accessToken();
    if (!token) {
      return throwError(() => new Error('No hay una sesion activa.'));
    }
    return this.http.get<TutorAlumno[]>(`${this.apiBaseUrl}/tutor/alumnos`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
    });
  }
}

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/$/, '');
}
