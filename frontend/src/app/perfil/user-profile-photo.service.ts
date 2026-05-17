import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../core/api/api.config';

export type UserProfilePhotoResponse = {
  hasPhoto: boolean;
  photoDataUrl: string | null;
  fotoContentType: string | null;
  fotoFileName: string | null;
};

@Injectable({ providedIn: 'root' })
export class UserProfilePhotoService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiBaseUrl = withoutTrailingSlash(inject(API_BASE_URL));

  getMine(): Observable<UserProfilePhotoResponse> {
    return this.withAuth((headers) =>
      this.http.get<UserProfilePhotoResponse>(this.baseUrl(), { headers }),
    );
  }

  uploadPhoto(file: File): Observable<UserProfilePhotoResponse> {
    const body = new FormData();
    body.append('file', file);
    return this.withAuth((headers) =>
      this.http.put<UserProfilePhotoResponse>(this.baseUrl(), body, { headers }),
    );
  }

  private baseUrl(): string {
    return `${this.apiBaseUrl}/users/me/foto`;
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
