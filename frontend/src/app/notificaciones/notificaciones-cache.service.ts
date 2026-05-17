import { Injectable, effect, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Notificacion } from './notificaciones.models';

@Injectable({ providedIn: 'root' })
export class NotificacionesCacheService {
  private readonly authService = inject(AuthService);
  private items: Notificacion[] | null = null;
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

  get(): Notificacion[] | null {
    return this.items;
  }

  set(items: Notificacion[]): void {
    this.items = items;
  }

  update(updater: (items: Notificacion[]) => Notificacion[]): void {
    if (this.items === null) {
      return;
    }
    this.items = updater(this.items);
  }

  invalidate(): void {
    this.items = null;
  }
}
