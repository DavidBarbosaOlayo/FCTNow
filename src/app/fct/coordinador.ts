import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-coordinador-page',
  template: `
    <main class="page-shell route-page">
      <header class="route-hero">
        <p class="eyebrow">Coordinador</p>
        <h1>Panel inicial de coordinación</h1>
        <p>
          Punto de partida para tener una visión global de empresas, ofertas, solicitudes,
          asignaciones y bloqueos del ciclo FCT.
        </p>
      </header>

      <section class="route-panel" aria-label="Próximas áreas de coordinación">
        <h2>Áreas previstas</h2>
        <ul class="route-list">
          <li>Revisión de solicitudes y criterios de asignación.</li>
          <li>Estado operativo de grupos, empresas y plazas.</li>
          <li>Documentación, informes y cierre de ciclo.</li>
        </ul>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinadorPage {}
