import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-page',
  template: `
    <main class="page-shell route-page">
      <section class="route-panel" aria-label="Próximas áreas de administración">
        <h2>Áreas previstas</h2>
        <ul class="route-list">
          <li>Usuarios y roles de acceso.</li>
          <li>Ciclos, grupos y datos de centro.</li>
          <li>Parámetros generales del proceso FCT.</li>
        </ul>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPage {}
