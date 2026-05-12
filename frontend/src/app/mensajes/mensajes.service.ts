import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
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
  private static readonly SEEN_STORAGE_PREFIX = 'fctnow.mensajes.seen.';

  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiBaseUrl = withoutTrailingSlash(inject(API_BASE_URL));
  private readonly mineState = signal<Conversacion[]>([]);
  private readonly seenState = signal<Record<string, string>>({});

  readonly unreadCount = computed(() => {
    if (!canUseMessages(this.authService.currentUser()?.roles ?? [])) {
      return 0;
    }

    const seen = this.seenState();
    return this.mineState().filter((conversacion) => {
      if (conversacion.ultimoMensaje === null || conversacion.ultimoMensajePropio !== false) {
        return false;
      }

      const lastSeenAt = seen[String(conversacion.id)];
      return lastSeenAt == null || Date.parse(lastSeenAt) < Date.parse(conversacion.updatedAt);
    }).length;
  });

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      this.seenState.set(this.readSeenState(user?.id ?? null));

      if (!canUseMessages(user?.roles ?? [])) {
        this.mineState.set([]);
      }
    });
  }

  listConversaciones(): Observable<Conversacion[]> {
    return this.withAuth((headers) =>
      this.http.get<Conversacion[]>(`${this.baseUrl()}/conversaciones`, { headers }).pipe(
        tap((items) => {
          this.mineState.set(canUseMessages(this.authService.currentUser()?.roles ?? []) ? items : []);
        }),
      ),
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
      this.http.post<Conversacion>(`${this.baseUrl()}/conversaciones`, request, { headers }).pipe(
        tap((conversacion) => {
          this.mineState.update((items) => upsertConversation(items, conversacion));
          this.markConversationSeen(conversacion.id, conversacion.updatedAt);
        }),
      ),
    );
  }

  enviarMensaje(conversacionId: number, request: MensajeRequest): Observable<Mensaje> {
    return this.withAuth((headers) =>
      this.http.post<Mensaje>(
        `${this.baseUrl()}/conversaciones/${conversacionId}/mensajes`,
        { contenido: request.contenido.trim() },
        { headers },
      ).pipe(
        tap((mensaje) => {
          this.mineState.update((items) =>
            items.map((item) =>
              item.id === conversacionId
                ? {
                    ...item,
                    ultimoMensaje: mensaje.contenido,
                    ultimoMensajeAt: mensaje.createdAt,
                    ultimoMensajePropio: true,
                    updatedAt: mensaje.createdAt,
                  }
                : item,
            ),
          );
          this.markConversationSeen(conversacionId, mensaje.createdAt);
        }),
      ),
    );
  }

  refreshMine(): void {
    this.listConversaciones().subscribe({ error: () => this.mineState.set([]) });
  }

  clearMine(): void {
    this.mineState.set([]);
  }

  markConversationSeen(conversacionId: number, updatedAt: string): void {
    const userId = this.authService.currentUser()?.id ?? null;
    if (userId === null) {
      return;
    }

    const nextState = {
      ...this.seenState(),
      [String(conversacionId)]: updatedAt,
    };
    this.seenState.set(nextState);
    this.writeSeenState(userId, nextState);
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

  private readSeenState(userId: number | null): Record<string, string> {
    const storage = browserStorage();
    if (storage == null || userId == null) {
      return {};
    }

    const raw = storage.getItem(this.storageKey(userId));
    if (raw == null) {
      return {};
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      return isStringRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  private writeSeenState(userId: number, state: Record<string, string>): void {
    browserStorage()?.setItem(this.storageKey(userId), JSON.stringify(state));
  }

  private storageKey(userId: number): string {
    return `${MensajesService.SEEN_STORAGE_PREFIX}${userId}`;
  }
}

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/$/, '');
}

function upsertConversation(conversaciones: Conversacion[], conversacion: Conversacion): Conversacion[] {
  const withoutCurrent = conversaciones.filter((item) => item.id !== conversacion.id);
  return [conversacion, ...withoutCurrent].sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );
}

function canUseMessages(roles: readonly string[]): boolean {
  return roles.includes('ALUMNO') || roles.includes('TUTOR_CENTRO') || roles.includes('COORDINADOR');
}

function browserStorage(): Storage | null {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every((item) => typeof item === 'string')
  );
}
