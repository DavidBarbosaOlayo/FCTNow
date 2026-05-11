import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-alumno-page',
  template: `
    <main class="page-shell route-page">
      <section class="route-panel" aria-label="Próximas áreas del alumno">
        <h2>Áreas previstas</h2>
        <ul class="route-list">
          <li>Perfil académico y profesional.</li>
          <li>Preferencias de empresa, horario y ubicación.</li>
          <li>Solicitudes y seguimiento de candidaturas.</li>
        </ul>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlumnoPage {}
