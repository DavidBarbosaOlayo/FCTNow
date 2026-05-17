import { Injectable, effect, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { EmpresaSolicitud } from './empresa-solicitudes.models';

@Injectable({ providedIn: 'root' })
export class MisSolicitudesEmpresaCacheService {
  private readonly authService = inject(AuthService);
  private items: EmpresaSolicitud[] | null = null;
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

  get(): EmpresaSolicitud[] | null {
    return this.items;
  }

  set(items: EmpresaSolicitud[]): void {
    this.items = items;
  }

  update(updater: (items: EmpresaSolicitud[]) => EmpresaSolicitud[]): void {
    if (this.items === null) {
      return;
    }
    this.items = updater(this.items);
  }

  invalidate(): void {
    this.items = null;
  }
}
