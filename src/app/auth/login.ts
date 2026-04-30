import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-login-page',
  template: `
    <main class="page-shell route-page">
      <header class="route-hero">
        <p class="eyebrow">Acceso</p>
        <h1>Entrada a FCTNow</h1>
        <p>
          Punto reservado para el futuro inicio de sesión de alumnado, empresas, tutores,
          coordinación y administración.
        </p>
      </header>

      <section class="route-panel" aria-label="Estado del acceso">
        <h2>Preparado para autenticación</h2>
        <p>
          Esta pantalla no valida credenciales todavía. Deja la ruta lista para conectar el flujo
          real cuando exista backend y autorización por roles.
        </p>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {}
