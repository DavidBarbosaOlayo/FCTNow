import { Injectable, effect, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { SolicitudFct } from '../practicas/solicitudes.models';

@Injectable({ providedIn: 'root' })
export class MisSolicitudesCacheService {
  private readonly authService = inject(AuthService);
  private items: SolicitudFct[] | null = null;
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

  get(): SolicitudFct[] | null {
    return this.items;
  }

  set(items: SolicitudFct[]): void {
    this.items = items;
  }

  invalidate(): void {
    this.items = null;
  }
}
