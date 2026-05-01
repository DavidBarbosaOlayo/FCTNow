import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-notificaciones-page',
  template: `
    <main class="page-shell route-page">
      <header class="route-hero">
        <p class="eyebrow">Notificaciones</p>
        <h1>Centro de notificaciones</h1>
        <p>
          Espacio reservado para mostrar avisos relevantes del ciclo FCT, como cambios de estado,
          mensajes pendientes o tareas de seguimiento.
        </p>
      </header>

      <section class="route-panel" aria-label="Estructura prevista para notificaciones">
        <h2>Estructura prevista</h2>
        <ul class="route-list">
          <li>Notificaciones recientes ordenadas por prioridad y fecha.</li>
          <li>Separación entre avisos informativos y acciones pendientes.</li>
          <li>Preparación para futuros indicadores de leído o no leído.</li>
        </ul>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificacionesPage {}
