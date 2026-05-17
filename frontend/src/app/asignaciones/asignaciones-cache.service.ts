import { Injectable, effect, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import {
  AsignacionExternaCandidata,
  AsignacionFctExterna,
} from './asignaciones-externas.models';
import { AsignacionCandidata, AsignacionFct } from './asignaciones.models';

export type AsignacionesSnapshot = {
  internas: AsignacionFct[];
  externas: AsignacionFctExterna[];
  candidatasInternas: AsignacionCandidata[];
  candidatasExternas: AsignacionExternaCandidata[];
};

@Injectable({ providedIn: 'root' })
export class AsignacionesCacheService {
  private readonly authService = inject(AuthService);
  private snapshot: AsignacionesSnapshot | null = null;
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

  get(): AsignacionesSnapshot | null {
    return this.snapshot;
  }

  set(snapshot: AsignacionesSnapshot): void {
    this.snapshot = snapshot;
  }

  invalidate(): void {
    this.snapshot = null;
  }
}
