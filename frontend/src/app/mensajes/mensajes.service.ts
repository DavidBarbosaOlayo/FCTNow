import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../core/api/api.config';
import {
  ContactoMensaje,
  Conversacion,
  ConversacionCreateRequest,
  Mensaje,
  MensajeRequest,
} from './mensajes.models';

@Injectable({ providedIn: 'root' })
export class MensajesService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiBaseUrl = withoutTrailingSlash(inject(API_BASE_URL));

  listConversaciones(): Observable<Conversacion[]> {
    return this.withAuth((headers) =>
      this.http.get<Conversacion[]>(`${this.baseUrl()}/conversaciones`, { headers }),
    );
  }

  listMensajes(conversacionId: number): Observable<Mensaje[]> {
    return this.withAuth((headers) =>
      this.http.get<Mensaje[]>(`${this.baseUrl()}/conversaciones/${conversacionId}`, { headers }),
    );
  }

  buscarContactos(nombre: string): Observable<ContactoMensaje[]> {
    return this.withAuth((headers) =>
      this.http.get<ContactoMensaje[]>(`${this.baseUrl()}/contactos`, {
        headers,
        params: nombre.trim() ? { nombre: nombre.trim() } : {},
      }),
    );
  }

  crearConversacion(request: ConversacionCreateRequest): Observable<Conversacion> {
    return this.withAuth((headers) =>
      this.http.post<Conversacion>(`${this.baseUrl()}/conversaciones`, request, { headers }),
    );
  }

  enviarMensaje(conversacionId: number, request: MensajeRequest): Observable<Mensaje> {
    return this.withAuth((headers) =>
      this.http.post<Mensaje>(
        `${this.baseUrl()}/conversaciones/${conversacionId}/mensajes`,
        { contenido: request.contenido.trim() },
        { headers },
      ),
    );
  }

  private baseUrl(): string {
    return `${this.apiBaseUrl}/mensajes`;
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
