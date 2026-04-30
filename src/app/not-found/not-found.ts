import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `
    <main class="page-shell route-page">
      <header class="route-hero">
        <p class="eyebrow">404</p>
        <h1>Página no encontrada</h1>
        <p>
          La ruta solicitada no existe todavía en FCTNow. Vuelve a la portada para continuar desde
          la base actual del producto.
        </p>
      </header>

      <nav class="route-actions" aria-label="Navegación de recuperación">
        <a routerLink="/">Volver a FCTNow</a>
      </nav>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}
