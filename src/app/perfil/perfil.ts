import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-perfil-page',
  template: `
    <main class="page-shell route-page">
      <header class="route-hero">
        <p class="eyebrow">Perfil</p>
        <h1>Perfil de usuario</h1>
        <p>
          Espacio reservado para consultar y mantener los datos principales del usuario cuando se
          incorpore autenticación y gestión real de cuentas.
        </p>
      </header>

      <section class="route-panel" aria-label="Estructura prevista para perfil">
        <h2>Estructura prevista</h2>
        <ul class="route-list">
          <li>Datos personales y académicos o profesionales según el rol.</li>
          <li>Preferencias de contacto y visibilidad dentro de FCTNow.</li>
          <li>Acceso futuro a seguridad, sesiones y configuración de cuenta.</li>
        </ul>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilPage {}
