import { Injectable, effect, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { OfertaFct } from '../practicas/ofertas.models';

@Injectable({ providedIn: 'root' })
export class MisOfertasEmpresaCacheService {
  private readonly authService = inject(AuthService);
  private items: OfertaFct[] | null = null;
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

  get(): OfertaFct[] | null {
    return this.items;
  }

  set(items: OfertaFct[]): void {
    this.items = items;
  }

  update(updater: (items: OfertaFct[]) => OfertaFct[]): void {
    if (this.items === null) {
      return;
    }
    this.items = updater(this.items);
  }

  invalidate(): void {
    this.items = null;
  }
}
