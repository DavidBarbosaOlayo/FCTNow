import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-alumno-page',
  template: `
    <main class="page-shell route-page">
      <header class="route-hero">
        <p class="eyebrow">Alumno</p>
        <h1>Panel inicial del alumno</h1>
        <p>
          Espacio reservado para consultar ofertas FCT, completar preferencias y revisar el estado
          de las solicitudes.
        </p>
      </header>

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
