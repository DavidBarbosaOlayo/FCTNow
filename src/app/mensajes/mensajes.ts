import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-mensajes-page',
  template: `
    <main class="page-shell route-page">
      <header class="route-hero">
        <p class="eyebrow">Mensajes</p>
        <h1>Mensajería de FCTNow</h1>
        <p>
          Espacio reservado para centralizar conversaciones entre alumnado, empresas, tutores y
          coordinación sin implementar todavía comunicación real.
        </p>
      </header>

      <section class="route-panel" aria-label="Estructura prevista para mensajes">
        <h2>Estructura prevista</h2>
        <ul class="route-list">
          <li>Bandeja de conversaciones del usuario.</li>
          <li>Detalle de hilos vinculados a prácticas o solicitudes.</li>
          <li>Estados de lectura y avisos pendientes en futuras iteraciones.</li>
        </ul>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MensajesPage {}
