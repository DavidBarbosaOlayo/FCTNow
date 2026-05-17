import { Injectable, effect, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { AlumnoPreferencias } from './preferencias.models';

@Injectable({ providedIn: 'root' })
export class PreferenciasCacheService {
  private readonly authService = inject(AuthService);
  private preferences: AlumnoPreferencias | null = null;
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

  get(): AlumnoPreferencias | null {
    return this.preferences;
  }

  set(preferences: AlumnoPreferencias): void {
    this.preferences = preferences;
  }

  invalidate(): void {
    this.preferences = null;
  }
}
