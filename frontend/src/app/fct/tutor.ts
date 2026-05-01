import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-tutor-page',
  template: `
    <main class="page-shell route-page">
      <header class="route-hero">
        <p class="eyebrow">Tutor centro</p>
        <h1>Panel inicial del tutor</h1>
        <p>
          Espacio para supervisar alumnado asignado, registrar seguimiento de FCT y detectar
          incidencias durante la estancia.
        </p>
      </header>

      <section class="route-panel" aria-label="Próximas áreas del tutor">
        <h2>Áreas previstas</h2>
        <ul class="route-list">
          <li>Seguimientos periódicos y visitas.</li>
          <li>Incidencias y observaciones compartidas.</li>
          <li>Evaluación final desde el centro educativo.</li>
        </ul>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TutorPage {}
