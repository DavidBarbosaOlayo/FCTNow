import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

type NavigationItem = {
  label: string;
  path: string;
  exact: boolean;
};

@Component({
  selector: 'app-navigation',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="app-header">
      <a class="app-brand" routerLink="/" aria-label="Ir al inicio de FCTNow">FCTNow</a>

      <nav class="app-nav" aria-label="Navegación principal">
        @for (item of navigationItems; track item.path) {
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
  protected readonly navigationItems: NavigationItem[] = [
    { label: 'Inicio', path: '/', exact: true },
    { label: 'Prácticas', path: '/practicas', exact: true },
    { label: 'Mensajes', path: '/mensajes', exact: true },
    { label: 'Notificaciones', path: '/notificaciones', exact: true },
    { label: 'Perfil', path: '/perfil', exact: true },
  ];
}
