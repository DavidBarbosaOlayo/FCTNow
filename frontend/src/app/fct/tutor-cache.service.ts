import { Injectable, effect, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { TutorAlumno } from './tutor-alumnos.models';

@Injectable({ providedIn: 'root' })
export class TutorCacheService {
  private readonly authService = inject(AuthService);
  private alumnos: TutorAlumno[] | null = null;
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

  get(): TutorAlumno[] | null {
    return this.alumnos;
  }

  set(alumnos: TutorAlumno[]): void {
    this.alumnos = alumnos;
  }

  invalidate(): void {
    this.alumnos = null;
  }
}
