import { Injectable, effect, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { OfertaExterna } from './ofertas-externas.models';
import { OfertaFct, OfertaFctFilters } from './ofertas.models';
import { SolicitudExterna } from './solicitudes-externas.models';

export type PracticasFiltersKey = string;

export type InternasSnapshot = {
  filtersKey: PracticasFiltersKey;
  ofertas: OfertaFct[];
};

export type ExternasSnapshot = {
  filtersKey: PracticasFiltersKey;
  ofertas: OfertaExterna[];
  page: number;
  total: number;
  attribution: string;
  attributionUrl: string;
};

@Injectable({ providedIn: 'root' })
export class PracticasCacheService {
  private readonly authService = inject(AuthService);
  private internas: InternasSnapshot | null = null;
  private externas: ExternasSnapshot | null = null;
  private mineExternas: SolicitudExterna[] | null = null;
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

  buildFiltersKey(filters: OfertaFctFilters): PracticasFiltersKey {
    return [
      filters.q ?? '',
      filters.familiaProfesional ?? '',
      filters.localidad ?? '',
      filters.modalidad ?? '',
    ].join('|');
  }

  getInternas(filtersKey: PracticasFiltersKey): InternasSnapshot | null {
    return this.internas?.filtersKey === filtersKey ? this.internas : null;
  }

  setInternas(snapshot: InternasSnapshot): void {
    this.internas = snapshot;
  }

  getExternas(filtersKey: PracticasFiltersKey): ExternasSnapshot | null {
    return this.externas?.filtersKey === filtersKey ? this.externas : null;
  }

  setExternas(snapshot: ExternasSnapshot): void {
    this.externas = snapshot;
  }

  getMineExternas(): SolicitudExterna[] | null {
    return this.mineExternas;
  }

  setMineExternas(items: SolicitudExterna[]): void {
    this.mineExternas = items;
  }

  invalidate(): void {
    this.internas = null;
    this.externas = null;
    this.mineExternas = null;
  }
}
