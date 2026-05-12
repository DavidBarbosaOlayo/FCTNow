import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

export type RouteDirection = 'forward' | 'backward' | 'none';

const NAV_ORDER: readonly string[] = [
  '/',
  '/practicas',
  '/alumno/solicitudes',
  '/empresa/ofertas',
  '/empresa/solicitudes',
  '/tutor',
  '/asignaciones',
  '/mensajes',
  '/notificaciones',
  '/perfil',
];

@Injectable({ providedIn: 'root' })
export class RouteTransitionsService {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private pendingDirection: RouteDirection = 'none';
  private lastIndex: number | null = null;

  constructor() {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationStart | NavigationEnd =>
            event instanceof NavigationStart || event instanceof NavigationEnd,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.computePending(event.url);
        } else {
          this.commit(event.urlAfterRedirects ?? event.url);
        }
      });
  }

  consumeDirection(): RouteDirection {
    const direction = this.pendingDirection;
    this.pendingDirection = 'none';
    return direction;
  }

  private computePending(url: string): void {
    const idx = NAV_ORDER.indexOf(normalize(url));
    if (idx < 0 || this.lastIndex === null) {
      this.pendingDirection = 'none';
      return;
    }
    if (idx > this.lastIndex) {
      this.pendingDirection = 'forward';
    } else if (idx < this.lastIndex) {
      this.pendingDirection = 'backward';
    } else {
      this.pendingDirection = 'none';
    }
  }

  private commit(url: string): void {
    const idx = NAV_ORDER.indexOf(normalize(url));
    if (idx >= 0) {
      this.lastIndex = idx;
    }
  }
}

function normalize(url: string): string {
  const noHash = url.split('#')[0];
  const noQuery = noHash.split('?')[0];
  if (noQuery.length > 1 && noQuery.endsWith('/')) {
    return noQuery.slice(0, -1);
  }
  return noQuery;
}
