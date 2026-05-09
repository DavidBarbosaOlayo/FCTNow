import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserRole } from '../auth/auth.models';
import { AuthService } from '../auth/auth.service';

type NavigationItem = {
  label: string;
  path: string;
  exact: boolean;
  requireRole?: UserRole | UserRole[];
};

@Component({
  selector: 'app-navigation',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="app-header">
      <a class="app-brand" routerLink="/" aria-label="Ir al inicio de FCTNow">FCTNow</a>

      <nav class="app-nav" aria-label="Navegación principal">
        @for (item of visibleItems(); track item.path) {
          <a
            class="app-nav-link"
            [routerLink]="item.path"
            routerLinkActive="is-active"
            [routerLinkActiveOptions]="{ exact: item.exact }"
            ariaCurrentWhenActive="page"
          >
            {{ item.label }}
          </a>
        }
      </nav>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppNavigation {
  private readonly authService = inject(AuthService);
  private readonly currentUser = this.authService.currentUser;

  private readonly navigationItems: NavigationItem[] = [
    { label: 'Inicio', path: '/', exact: true },
    { label: 'Prácticas', path: '/practicas', exact: true },
    { label: 'Mis solicitudes', path: '/alumno/solicitudes', exact: true, requireRole: 'ALUMNO' },
    { label: 'Mis ofertas', path: '/empresa/ofertas', exact: true, requireRole: 'EMPRESA' },
    {
      label: 'Solicitudes recibidas',
      path: '/empresa/solicitudes',
      exact: true,
      requireRole: 'EMPRESA',
    },
    {
      label: 'Asignaciones',
      path: '/asignaciones',
      exact: true,
      requireRole: ['TUTOR_CENTRO', 'COORDINADOR'],
    },
    { label: 'Mensajes', path: '/mensajes', exact: true },
    { label: 'Notificaciones', path: '/notificaciones', exact: true },
    { label: 'Perfil', path: '/perfil', exact: true },
  ];

  protected readonly visibleItems = computed<NavigationItem[]>(() => {
    const roles = this.currentUser()?.roles ?? [];
    return this.navigationItems.filter((item) => {
      if (!item.requireRole) {
        return true;
      }
      const required = Array.isArray(item.requireRole) ? item.requireRole : [item.requireRole];
      return required.some((role) => roles.includes(role));
    });
  });
}
