import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../core/api/api.config';
import { Notificacion, RecomendacionRequest } from './notificaciones.models';

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiBaseUrl = withoutTrailingSlash(inject(API_BASE_URL));
  private readonly mineState = signal<Notificacion[]>([]);

  readonly unreadCount = computed(() => {
    const roles = this.authService.currentUser()?.roles ?? [];
    if (!roles.includes('ALUMNO')) {
      return 0;
    }
    return this.mineState().filter((notificacion) => !notificacion.leida).length;
  });

  listMine(): Observable<Notificacion[]> {
    return this.withAuth((headers) =>
      this.http.get<Notificacion[]>(`${this.baseUrl()}/me`, { headers }).pipe(
        tap((items) => {
          const roles = this.authService.currentUser()?.roles ?? [];
          this.mineState.set(roles.includes('ALUMNO') ? items : []);
        }),
      ),
    );
  }

  refreshMine(): void {
    this.listMine().subscribe({ error: () => this.mineState.set([]) });
  }

  clearMine(): void {
    this.mineState.set([]);
  }

  recomendar(request: RecomendacionRequest): Observable<Notificacion> {
    return this.withAuth((headers) =>
      this.http.post<Notificacion>(`${this.baseUrl()}/recomendaciones`, request, { headers }),
    );
  }

  marcarLeida(id: number): Observable<Notificacion> {
    return this.withAuth((headers) =>
      this.http.patch<Notificacion>(`${this.baseUrl()}/me/${id}/leida`, {}, { headers }).pipe(
        tap((updated) => {
          this.mineState.update((items) =>
            items.map((item) => (item.id === updated.id ? updated : item)),
          );
        }),
      ),
    );
  }

  delete(id: number): Observable<void> {
    return this.withAuth((headers) =>
      this.http.delete<void>(`${this.baseUrl()}/me/${id}`, { headers }).pipe(
        tap(() => {
          this.mineState.update((items) => items.filter((item) => item.id !== id));
        }),
      ),
    );
  }

  private baseUrl(): string {
    return `${this.apiBaseUrl}/notificaciones`;
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
