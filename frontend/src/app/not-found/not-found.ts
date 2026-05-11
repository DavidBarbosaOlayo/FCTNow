import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `
    <main class="page-shell route-page">
      <nav class="route-actions" aria-label="Navegación de recuperación">
        <a routerLink="/">Volver a FCTNow</a>
      </nav>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}
