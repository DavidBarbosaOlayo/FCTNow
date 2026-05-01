import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-practicas-page',
  template: `
    <main class="page-shell route-page">
      <header class="route-hero">
        <p class="eyebrow">Prácticas</p>
        <h1>Búsqueda de prácticas</h1>
        <p>
          Espacio reservado para localizar ofertas FCT disponibles y preparar una experiencia de
          búsqueda por sector, ubicación y perfil del alumnado.
        </p>
      </header>

      <section class="route-panel" aria-label="Estructura prevista para prácticas">
        <h2>Estructura prevista</h2>
        <ul class="route-list">
          <li>Listado de prácticas publicadas por empresas colaboradoras.</li>
          <li>Filtros por familia profesional, localidad, modalidad y estado.</li>
          <li>Detalle de cada oferta antes de iniciar una solicitud.</li>
        </ul>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticasPage {}
