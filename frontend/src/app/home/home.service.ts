import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../core/api/api.config';
import { StudentHomeFeed } from './home.models';

@Injectable({ providedIn: 'root' })
export class HomeService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiBaseUrl = withoutTrailingSlash(inject(API_BASE_URL));

  getStudentFeed(): Observable<StudentHomeFeed> {
    const accessToken = this.authService.accessToken();

    if (!accessToken) {
      return throwError(() => new Error('No hay una sesión activa de alumno.'));
    }

    return this.http.get<StudentHomeFeed>(`${this.apiBaseUrl}/alumnos/me/home`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${accessToken}` }),
    });
  }
}

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/$/, '');
}
