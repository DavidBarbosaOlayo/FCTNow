import { Injectable, effect, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Conversacion, Mensaje } from './mensajes.models';

@Injectable({ providedIn: 'root' })
export class MensajesCacheService {
  private readonly authService = inject(AuthService);
  private conversaciones: Conversacion[] | null = null;
  private mensajes = new Map<number, Mensaje[]>();
  private lastUserId: number | null = this.authService.currentUser()?.id ?? null;

  constructor() {
    effect(() => {
      const userId = this.authService.currentUser()?.id ?? null;
      if (userId !== this.lastUserId) {
        this.lastUserId = userId;
        this.invalidate();
      }
    });
  }

  getConversaciones(): Conversacion[] | null {
    return this.conversaciones;
  }

  setConversaciones(items: Conversacion[]): void {
    this.conversaciones = items;
  }

  updateConversaciones(updater: (items: Conversacion[]) => Conversacion[]): void {
    if (this.conversaciones === null) {
      return;
    }
    this.conversaciones = updater(this.conversaciones);
  }

  getMensajes(conversacionId: number): Mensaje[] | null {
    return this.mensajes.get(conversacionId) ?? null;
  }

  setMensajes(conversacionId: number, items: Mensaje[]): void {
    this.mensajes.set(conversacionId, items);
  }

  appendMensaje(conversacionId: number, mensaje: Mensaje): void {
    const current = this.mensajes.get(conversacionId);
    if (current) {
      this.mensajes.set(conversacionId, [...current, mensaje]);
    }
  }

  invalidate(): void {
    this.conversaciones = null;
    this.mensajes.clear();
  }
}
