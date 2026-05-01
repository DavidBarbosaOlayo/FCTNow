import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-page',
  template: `
    <main class="page-shell route-page">
      <header class="route-hero">
        <p class="eyebrow">Administración</p>
        <h1>Panel inicial de administración</h1>
        <p>
          Base para configurar usuarios, roles y datos maestros de FCTNow cuando exista el backend
          de gestión.
        </p>
      </header>

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
