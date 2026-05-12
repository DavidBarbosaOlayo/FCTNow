import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, fromEvent } from 'rxjs';
import { UserRole } from '../auth/auth.models';
import { AuthService } from '../auth/auth.service';
import { MensajesService } from '../mensajes/mensajes.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

type NavigationIconKey =
  | 'home'
  | 'briefcase'
  | 'file'
  | 'tag'
  | 'inbox'
  | 'clipboard'
  | 'message'
  | 'bell'
  | 'user';

type NavigationItem = {
  label: string;
  path: string;
  exact: boolean;
  icon: NavigationIconKey;
  requireRole?: UserRole | UserRole[];
  hideForRole?: UserRole | UserRole[];
};

const SCROLL_THRESHOLD_PX = 12;
const MOBILE_BREAKPOINT_PX = 560;
const ANONYMOUS_NAVIGATION_PATHS = new Set(['/', '/practicas', '/perfil']);

@Component({
  selector: 'app-navigation',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header
      class="app-header"
      [class.is-scrolled]="isScrolled()"
      [class.is-menu-open]="isMenuOpen()"
    >
      <a
        class="app-brand"
        routerLink="/"
        aria-label="Ir al inicio de FCTNow"
        (click)="closeMenu()"
      >
        <img class="app-brand-logo" src="/logo.png" alt="" aria-hidden="true" />
        <span class="app-brand-name">FCTNow</span>
      </a>

      <button
        type="button"
        class="app-nav-toggle"
        [attr.aria-expanded]="isMenuOpen()"
        aria-controls="app-nav"
        [attr.aria-label]="isMenuOpen() ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'"
        (click)="toggleMenu()"
      >
        <span class="app-nav-toggle-bar" aria-hidden="true"></span>
        <span class="app-nav-toggle-bar" aria-hidden="true"></span>
        <span class="app-nav-toggle-bar" aria-hidden="true"></span>
      </button>

      <nav id="app-nav" class="app-nav" aria-label="Navegación principal">
        @for (item of visibleItems(); track item.path) {
          <a
            class="app-nav-link"
            [routerLink]="item.path"
            routerLinkActive="is-active"
            [routerLinkActiveOptions]="{ exact: item.exact }"
            ariaCurrentWhenActive="page"
            [attr.aria-label]="item.label"
            [attr.title]="item.label"
            (click)="closeMenu()"
          >
            <span class="app-nav-icon" aria-hidden="true">
              @switch (item.icon) {
                @case ('home') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 11.5 12 4l9 7.5" />
                    <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
                  </svg>
                }
                @case ('briefcase') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                    stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="7" width="18" height="13" rx="2" />
                    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                    <path d="M3 13h18" />
                  </svg>
                }
                @case ('file') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                    <path d="M14 3v5h5" />
                    <path d="M9 13h6" />
                    <path d="M9 17h6" />
                  </svg>
                }
                @case ('tag') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 12.5 12.5 20a2 2 0 0 1-2.83 0L3 13.33V4h9.33L20 11.67a2 2 0 0 1 0 .83z" />
                    <circle cx="7.5" cy="8.5" r="1.3" />
                  </svg>
                }
                @case ('inbox') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 13h5l1.5 2h5L16 13h5" />
                    <path d="M5 5h14l2 8v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z" />
                  </svg>
                }
                @case ('clipboard') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                    stroke-linecap="round" stroke-linejoin="round">
                    <rect x="6" y="4" width="12" height="17" rx="2" />
                    <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
                    <path d="M9 11h6" />
                    <path d="M9 15h4" />
                  </svg>
                }
                @case ('message') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 5h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H8l-4 3V6a1 1 0 0 1 1-1z" />
                    <path d="M8 10h8" />
                    <path d="M8 13h5" />
                  </svg>
                  @if (messageBadge(item); as count) {
                    <span class="notification-badge" aria-label="Mensajes pendientes">
                      {{ count }}
                    </span>
                  }
                }
                @case ('bell') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5z" />
                    <path d="M10 20a2 2 0 0 0 4 0" />
                  </svg>
                  @if (notificationBadge(item); as count) {
                    <span class="notification-badge" aria-label="Notificaciones sin leer">
                      {{ count }}
                    </span>
                  }
                }
                @case ('user') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                    stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="8.5" r="3.8" />
                    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
                  </svg>
                }
              }
            </span>
            <span class="app-nav-label">{{ item.label }}</span>
          </a>
        }
      </nav>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppNavigation {
  private readonly authService = inject(AuthService);
  private readonly mensajesService = inject(MensajesService);
  private readonly notificacionesService = inject(NotificacionesService);
  private readonly currentUser = this.authService.currentUser;
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  protected readonly isScrolled = signal(false);
  protected readonly isMenuOpen = signal(false);
  protected readonly unreadMessages = this.mensajesService.unreadCount;
  protected readonly unreadNotifications = this.notificacionesService.unreadCount;

  private readonly navigationItems: NavigationItem[] = [
    { label: 'Inicio', path: '/', exact: true, icon: 'home' },
    { label: 'Prácticas', path: '/practicas', exact: true, icon: 'briefcase', hideForRole: 'EMPRESA' },
    {
      label: 'Mis solicitudes',
      path: '/alumno/solicitudes',
      exact: true,
      icon: 'file',
      requireRole: 'ALUMNO',
    },
    {
      label: 'Mis ofertas',
      path: '/empresa/ofertas',
      exact: true,
      icon: 'tag',
      requireRole: 'EMPRESA',
    },
    {
      label: 'Solicitudes recibidas',
      path: '/empresa/solicitudes',
      exact: true,
      icon: 'inbox',
      requireRole: 'EMPRESA',
    },
    {
      label: 'Panel tutor',
      path: '/tutor',
      exact: true,
      icon: 'clipboard',
      requireRole: ['TUTOR_CENTRO', 'COORDINADOR'],
    },
    {
      label: 'Asignaciones',
      path: '/asignaciones',
      exact: true,
      icon: 'clipboard',
      requireRole: 'COORDINADOR',
    },
    { label: 'Mensajes', path: '/mensajes', exact: true, icon: 'message' },
    { label: 'Notificaciones', path: '/notificaciones', exact: true, icon: 'bell' },
    { label: 'Perfil', path: '/perfil', exact: true, icon: 'user' },
  ];

  protected readonly visibleItems = computed<NavigationItem[]>(() => {
    const user = this.currentUser();
    const roles = user?.roles ?? [];
    return this.navigationItems.filter((item) => {
      if (!user && !ANONYMOUS_NAVIGATION_PATHS.has(item.path)) {
        return false;
      }
      if (item.hideForRole) {
        const hidden = Array.isArray(item.hideForRole) ? item.hideForRole : [item.hideForRole];
        if (hidden.some((role) => roles.includes(role))) {
          return false;
        }
      }
      if (!item.requireRole) {
        return true;
      }
      const required = Array.isArray(item.requireRole) ? item.requireRole : [item.requireRole];
      return required.some((role) => roles.includes(role));
    });
  });

  constructor() {
    effect(() => {
      const roles = this.currentUser()?.roles ?? [];
      if (roles.includes('ALUMNO') || roles.includes('TUTOR_CENTRO') || roles.includes('COORDINADOR')) {
        this.mensajesService.refreshMine();
      } else {
        this.mensajesService.clearMine();
      }

      if (roles.includes('ALUMNO')) {
        this.notificacionesService.refreshMine();
      } else {
        this.notificacionesService.clearMine();
      }
    });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeMenu());

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const view = this.document.defaultView;
    if (!view) {
      return;
    }

    this.updateScrolled(view.scrollY ?? 0);

    fromEvent(view, 'scroll', { passive: true })
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateScrolled(view.scrollY ?? 0));

    fromEvent(view, 'resize', { passive: true })
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (view.innerWidth >= MOBILE_BREAKPOINT_PX && this.isMenuOpen()) {
          this.isMenuOpen.set(false);
        }
      });
  }

  protected toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    if (this.isMenuOpen()) {
      this.isMenuOpen.set(false);
    }
  }

  protected notificationBadge(item: NavigationItem): string | null {
    if (item.path !== '/notificaciones') {
      return null;
    }
    const roles = this.currentUser()?.roles ?? [];
    if (!roles.includes('ALUMNO')) {
      return null;
    }
    const count = this.unreadNotifications();
    if (count <= 0) {
      return null;
    }
    return count > 99 ? '99+' : String(count);
  }

  protected messageBadge(item: NavigationItem): string | null {
    if (item.path !== '/mensajes') {
      return null;
    }
    const count = this.unreadMessages();
    if (count <= 0) {
      return null;
    }
    return count > 99 ? '99+' : String(count);
  }

  private updateScrolled(scrollY: number): void {
    const next = scrollY > SCROLL_THRESHOLD_PX;
    if (this.isScrolled() !== next) {
      this.isScrolled.set(next);
    }
  }
}
