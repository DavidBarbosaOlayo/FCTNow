import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-empresa-page',
  template: `
    <main class="page-shell route-page">
      <section class="route-panel" aria-label="Próximas áreas de empresa">
        <h2>Áreas previstas</h2>
        <ul class="route-list">
          <li>Ficha de empresa y personas de contacto.</li>
          <li>Publicación y revisión de ofertas FCT.</li>
          <li>Participación en seguimiento y evaluación.</li>
        </ul>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresaPage {}
