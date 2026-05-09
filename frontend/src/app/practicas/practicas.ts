import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AlumnoPreferenciasService } from '../alumnos/preferencias.service';
import { AuthService } from '../auth/auth.service';
import { ExternalOfferDetailDialog } from './external-offer-detail-dialog';
import { OfertaExterna, OfertaExternaPage } from './ofertas-externas.models';
import { OfertasExternasService } from './ofertas-externas.service';
import { OfertaFct, OfertaFctFilters, OfertaModalidad } from './ofertas.models';
import { OfertasService } from './ofertas.service';
import { PracticasCacheService } from './practicas-cache.service';
import { FAMILIAS_PROFESIONALES, LOCALIDADES_ES } from './practicas-options';
import {
  SolicitudExterna,
  SolicitudExternaEstado,
} from './solicitudes-externas.models';
import { SolicitudesExternasService } from './solicitudes-externas.service';

type CatalogStatus = 'loading' | 'loaded' | 'error';

type ModalidadOption = {
  value: OfertaModalidad;
  label: string;
};

@Component({
  selector: 'app-practicas-page',
  imports: [ReactiveFormsModule, RouterLink, ExternalOfferDetailDialog],
  template: `
    <main class="page-shell route-page practicas-page">
      <header class="route-hero practicas-hero">
        <p class="eyebrow">Prácticas</p>
        <h1>Búsqueda de prácticas</h1>
        <p>
          Consulta ofertas FCT publicadas por empresas colaboradoras y filtra por familia
          profesional, localidad o modalidad.
        </p>
      </header>

      <section class="catalog-toolbar" aria-label="Filtros de ofertas FCT">
        <form class="filters-form" [formGroup]="filtersForm" (ngSubmit)="search()" novalidate>
          <div class="filter-field wide">
            <label for="practicas-q">Buscar</label>
            <input
              id="practicas-q"
              type="search"
              formControlName="q"
              placeholder="Título, empresa o tareas"
            />
          </div>

          <div class="filter-field">
            <label for="practicas-familia">Familia profesional</label>
            <select id="practicas-familia" formControlName="familiaProfesional">
              <option value="">Todas las familias</option>
              @for (familia of familiaOptions; track familia.value) {
                <option [value]="familia.value">{{ familia.label }}</option>
              }
            </select>
          </div>

          <div class="filter-field">
            <label for="practicas-localidad">Localidad</label>
            <select id="practicas-localidad" formControlName="localidad">
              <option value="">Toda España</option>
              @for (localidad of localidadOptions; track localidad) {
                <option [value]="localidad">{{ localidad }}</option>
              }
            </select>
          </div>

          <div class="filter-field">
            <label for="practicas-modalidad">Modalidad</label>
            <select id="practicas-modalidad" formControlName="modalidad">
              <option value="">Todas</option>
              @for (option of modalidadOptions; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
          </div>

          <div class="filter-actions">
            <button class="primary-action" type="submit">Buscar</button>
            <button class="secondary-action" type="button" (click)="clearFilters()">Limpiar</button>
          </div>
        </form>
      </section>

      <section
        class="catalog-results catalog-results-externas"
        aria-live="polite"
        aria-label="Ofertas externas de Adzuna"
      >
        <div class="results-heading">
          <p class="eyebrow">Ofertas reales · Adzuna</p>
          <h2>{{ externasResultsTitle() }}</h2>
          <p class="results-hint">
            Resultados de portales de empleo que coinciden con tu búsqueda. La aplicación se realiza
            en el sitio externo.
          </p>
        </div>

        @if (externasStatus() === 'loading') {
          <div class="state-panel">
            <p class="eyebrow">Cargando</p>
            <h2>Buscando ofertas reales</h2>
            <p>Estamos consultando ofertas reales de Adzuna para España.</p>
          </div>
        } @else if (externasStatus() === 'error') {
          <div class="state-panel alert" role="alert">
            <p class="eyebrow">Fuente externa no disponible</p>
            <h2>No se pudieron cargar las ofertas externas</h2>
            <p>{{ externasErrorMessage() }}</p>
          </div>
        } @else if (hasExternalUnsupportedFilters()) {
          <div class="state-panel">
            <p class="eyebrow">Filtro no disponible</p>
            <h2>La modalidad solo se aplica a las ofertas FCT publicadas</h2>
            <p>
              La fuente externa no devuelve el dato de modalidad, así que no podemos filtrar
              esas ofertas por presencial, híbrida o remota.
            </p>
          </div>
        } @else if (ofertasExternas().length === 0) {
          <div class="state-panel">
            <p class="eyebrow">Sin resultados</p>
            <h2>No hay ofertas externas con esos filtros</h2>
            <p>Prueba con otra palabra clave o cambia la localidad.</p>
          </div>
        } @else {
          <div class="offer-grid">
            @for (oferta of ofertasExternas(); track oferta.id) {
              <article class="offer-card offer-card-externa">
                <div class="offer-card-heading">
                  <div class="external-card-topline">
                    <span class="offer-source-tag" aria-label="Fuente externa">Adzuna</span>
                    <div class="external-tracking-corner" aria-label="Seguimiento de solicitud">
                      @if (solicitudFor(oferta); as solicitud) {
                        @if (solicitud.estado === 'SOLICITADA') {
                          <button
                            type="button"
                            class="tracking-toggle is-estado-solicitada"
                            [disabled]="isExternalActionInFlight(oferta)"
                            aria-label="Solicitada — pulsa para anular"
                            (click)="anularSolicitud(oferta)"
                          >
                            <span class="state">Solicitada</span>
                            <span class="hover">Anular solicitud</span>
                          </button>
                          <button
                            type="button"
                            class="tracking-label is-primary"
                            [disabled]="isExternalActionInFlight(oferta)"
                            (click)="markAsAceptada(oferta)"
                          >
                            Marcar aceptada
                          </button>
                        } @else if (solicitud.estado === 'ACEPTADA') {
                          <button
                            type="button"
                            class="tracking-toggle is-estado-aceptada"
                            [disabled]="isExternalActionInFlight(oferta)"
                            aria-label="Aceptada — pulsa para anular"
                            (click)="anularSolicitud(oferta)"
                          >
                            <span class="state">Aceptada</span>
                            <span class="hover">Anular solicitud</span>
                          </button>
                        } @else {
                          <button
                            type="button"
                            class="tracking-label"
                            [disabled]="isExternalActionInFlight(oferta)"
                            (click)="markAsSolicitada(oferta)"
                          >
                            Marcar como solicitada
                          </button>
                        }
                      } @else {
                        <button
                          type="button"
                          class="tracking-label"
                          [disabled]="isExternalActionInFlight(oferta)"
                          (click)="markAsSolicitada(oferta)"
                        >
                          Marcar como solicitada
                        </button>
                      }
                    </div>
                  </div>
                  <p class="offer-company">{{ oferta.empresaNombre || 'Empresa no especificada' }}</p>
                  <h2>{{ oferta.titulo }}</h2>
                  @if (oferta.descripcion) {
                    <p>{{ oferta.descripcion }}</p>
                  }
                </div>

                <dl class="offer-details" aria-label="Datos principales de la oferta externa">
                  @if (oferta.localidad) {
                    <div>
                      <dt>Localidad</dt>
                      <dd>{{ oferta.localidad }}{{ oferta.region ? ', ' + oferta.region : '' }}</dd>
                    </div>
                  }
                  @if (oferta.categoria) {
                    <div>
                      <dt>Categoría</dt>
                      <dd>{{ oferta.categoria }}</dd>
                    </div>
                  }
                  @if (oferta.jornada) {
                    <div>
                      <dt>Jornada</dt>
                      <dd>{{ oferta.jornada }}</dd>
                    </div>
                  }
                  @if (oferta.salarioMinimo || oferta.salarioMaximo) {
                    <div>
                      <dt>Salario</dt>
                      <dd>{{ salaryLabel(oferta) }}</dd>
                    </div>
                  }
                </dl>

                <div class="external-card-actions">
                  <a
                    class="offer-link"
                    [href]="oferta.urlAplicacion"
                    target="_blank"
                    rel="noopener noreferrer"
                    [attr.aria-label]="'Ver oferta de ' + oferta.titulo + ' en Adzuna'"
                  >
                    Ver oferta en Adzuna
                  </a>
                  <button
                    type="button"
                    class="offer-link secondary"
                    (click)="openExternalDetail(oferta)"
                  >
                    Ver detalles
                  </button>
                </div>
              </article>
            }
          </div>

          @if (externalActionError()) {
            <p class="load-more-error" role="alert">{{ externalActionError() }}</p>
          }

          @if (canLoadMoreExternal()) {
            <div class="load-more-row">
              <p class="load-more-hint">
                Mostrando {{ ofertasExternas().length }} de {{ externasTotal() }}
              </p>
              <button
                type="button"
                class="load-more-action"
                (click)="loadMoreExternalOffers()"
                [disabled]="externasLoadingMore()"
              >
                {{ externasLoadingMore() ? 'Cargando…' : 'Cargar más ofertas' }}
              </button>
            </div>
          }

          @if (externasLoadingMoreError()) {
            <p class="load-more-error" role="alert">{{ externasErrorMessage() }}</p>
          }

          <p class="adzuna-attribution">
            <a
              [href]="externasAttributionUrl()"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ externasAttribution() }}
            </a>
          </p>
        }
      </section>

      <section class="catalog-results" aria-live="polite" aria-label="Ofertas FCT publicadas">
        @if (status() === 'loading') {
          <div class="state-panel">
            <p class="eyebrow">Cargando</p>
            <h2>Buscando ofertas publicadas</h2>
            <p>Estamos consultando el catálogo disponible para este ciclo FCT.</p>
          </div>
        } @else if (status() === 'error') {
          <div class="state-panel alert" role="alert">
            <p class="eyebrow">Error</p>
            <h2>No se pudieron cargar las ofertas</h2>
            <p>{{ errorMessage() }}</p>
          </div>
        } @else if (ofertas().length === 0) {
          <div class="state-panel">
            <p class="eyebrow">Sin resultados</p>
            <h2>No hay ofertas con esos filtros</h2>
            <p>Prueba con otra familia profesional, localidad o modalidad.</p>
          </div>
        } @else {
          <div class="results-heading">
            <p class="eyebrow">Ofertas publicadas</p>
            <h2>{{ resultsTitle() }}</h2>
          </div>

          <div class="offer-grid">
            @for (oferta of ofertas(); track oferta.id) {
              <article class="offer-card">
                <div class="offer-card-heading">
                  <p class="offer-company">{{ oferta.empresaNombre }}</p>
                  <h2>{{ oferta.titulo }}</h2>
                  <p>{{ oferta.descripcion }}</p>
                </div>

                <dl class="offer-details" aria-label="Datos principales de la oferta">
                  <div>
                    <dt>Familia</dt>
                    <dd>{{ oferta.familiaProfesional }}</dd>
                  </div>
                  <div>
                    <dt>Localidad</dt>
                    <dd>{{ oferta.localidad }}, {{ oferta.provincia }}</dd>
                  </div>
                  <div>
                    <dt>Modalidad</dt>
                    <dd>{{ modalidadLabel(oferta.modalidad) }}</dd>
                  </div>
                  <div>
                    <dt>Fechas</dt>
                    <dd>{{ oferta.fechaInicio }} - {{ oferta.fechaFin }}</dd>
                  </div>
                  <div>
                    <dt>Plazas</dt>
                    <dd>{{ oferta.plazas }}</dd>
                  </div>
                </dl>

                <p class="offer-tasks">{{ oferta.tareas }}</p>

                <a
                  class="offer-link"
                  [routerLink]="['/practicas', oferta.id]"
                  [attr.aria-label]="'Ver detalle de ' + oferta.titulo"
                >
                  Ver detalle
                </a>
              </article>
            }
          </div>
        }
      </section>

      @if (selectedExternalOffer(); as detail) {
        <app-external-offer-detail-dialog
          [offer]="detail"
          [solicitud]="solicitudFor(detail)"
          [actionInFlight]="isExternalActionInFlight(detail)"
          (closed)="closeExternalDetail()"
          (solicit)="markAsSolicitada(detail)"
          (anular)="anularSolicitud(detail)"
        />
      }
    </main>
  `,
  styles: [
    `
      .practicas-page {
        align-content: start;
        gap: 1.1rem;
        padding-top: 2rem;
      }

      .practicas-hero {
        max-width: 68rem;
      }

      .practicas-hero h1 {
        max-width: 18ch;
      }

      .catalog-toolbar,
      .state-panel {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 0.5rem;
        box-shadow: var(--shadow-soft);
        backdrop-filter: blur(14px);
      }

      .catalog-toolbar {
        padding: 1rem;
      }

      .filters-form {
        display: grid;
        grid-template-columns: minmax(14rem, 1.35fr) repeat(3, minmax(10rem, 1fr)) auto;
        gap: 0.85rem;
        align-items: end;
      }

      .filter-field {
        min-width: 0;
        display: grid;
        gap: 0.4rem;
      }

      .filter-field label {
        color: var(--ink);
        font-size: 0.86rem;
        font-weight: 800;
      }

      .filter-field input,
      .filter-field select {
        width: 100%;
        min-height: 2.75rem;
        padding: 0 0.8rem;
        border: 1px solid var(--line);
        border-radius: 0.5rem;
        color: var(--ink);
        background: rgba(255, 255, 255, 0.74);
        font: inherit;
        outline: none;
      }

      .filter-field input:focus-visible,
      .filter-field select:focus-visible {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.16);
      }

      .filter-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .primary-action,
      .secondary-action {
        min-height: 2.75rem;
        padding: 0 0.9rem;
        border-radius: 0.5rem;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
      }

      .primary-action {
        border: 0;
        color: #f7fbf8;
        background: var(--accent);
      }

      .secondary-action {
        border: 1px solid var(--line);
        color: var(--ink);
        background: rgba(255, 255, 255, 0.54);
      }

      .primary-action:hover,
      .primary-action:focus-visible {
        background: #0b5f59;
        outline: none;
      }

      .secondary-action:hover,
      .secondary-action:focus-visible {
        border-color: rgba(15, 118, 110, 0.36);
        outline: none;
      }

      .catalog-results {
        display: grid;
        gap: 1rem;
      }

      .results-heading {
        display: grid;
        gap: 0.35rem;
      }

      .results-heading h2,
      .state-panel h2,
      .offer-card h2 {
        font-family: inherit;
        line-height: 1.2;
      }

      .results-heading h2,
      .state-panel h2 {
        font-size: 1.45rem;
      }

      .state-panel {
        padding: 1.2rem;
      }

      .state-panel p:not(.eyebrow) {
        margin: 0.7rem 0 0;
        color: var(--muted);
        line-height: 1.65;
      }

      .state-panel.alert {
        border-color: rgba(184, 79, 59, 0.28);
        background: rgba(255, 246, 241, 0.9);
      }

      .offer-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
        gap: 1rem;
      }

      .offer-card {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        height: 100%;
        padding: 1rem;
        border: 1px solid var(--line);
        border-radius: 0.5rem;
        background: rgba(255, 251, 245, 0.72);
        box-shadow: var(--shadow-soft);
      }

      .offer-card-heading {
        display: grid;
        gap: 0.55rem;
      }

      .offer-company {
        margin: 0;
        color: var(--accent);
        font-size: 0.82rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .offer-card h2 {
        margin: 0;
        font-size: 1.2rem;
      }

      .offer-card p {
        margin: 0;
        color: var(--muted);
        line-height: 1.6;
      }

      .offer-details {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.65rem;
        margin: 0;
      }

      .offer-details div {
        min-width: 0;
      }

      .offer-details dt {
        color: var(--muted);
        font-size: 0.78rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .offer-details dd {
        margin: 0.2rem 0 0;
        color: var(--ink);
        font-weight: 700;
        line-height: 1.35;
      }

      .offer-tasks {
        padding-top: 0.85rem;
        border-top: 1px solid var(--line);
      }

      .offer-link {
        margin-top: auto;
        align-self: flex-start;
        min-height: 2.75rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 1rem;
        border-radius: 0.5rem;
        border: 0;
        color: #f7fbf8;
        background: var(--accent);
        font: inherit;
        font-weight: 800;
        text-decoration: none;
        cursor: pointer;
      }

      .offer-link:hover,
      .offer-link:focus-visible {
        background: #0b5f59;
        outline: none;
      }

      .offer-link.secondary {
        border: 1px solid var(--line);
        color: var(--ink);
        background: rgba(255, 255, 255, 0.68);
      }

      .offer-link.secondary:hover,
      .offer-link.secondary:focus-visible {
        border-color: rgba(15, 118, 110, 0.36);
        background: rgba(255, 255, 255, 0.9);
      }

      .catalog-results-externas {
        padding-top: 0.5rem;
        border-top: 1px solid var(--line);
      }

      .results-hint {
        margin: 0.35rem 0 0;
        color: var(--muted);
        font-size: 0.92rem;
        line-height: 1.55;
      }

      .offer-card-externa {
        background: rgba(244, 236, 223, 0.78);
        border-color: rgba(199, 101, 59, 0.28);
      }

      .external-card-topline {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.4rem;
      }

      .external-tracking-corner {
        margin-left: auto;
        display: inline-flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        align-items: center;
        gap: 0.35rem;
        min-width: 0;
      }

      .offer-source-tag {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 1.85rem;
        padding: 0 0.65rem;
        border-radius: 999px;
        background: rgba(199, 101, 59, 0.18);
        color: var(--accent-warm);
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .load-more-row {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 0.45rem;
        padding: 0.75rem 0 0.25rem;
      }

      .load-more-action {
        min-height: 2.75rem;
        padding: 0 1.4rem;
        border: 0;
        border-radius: 0.5rem;
        color: #f7fbf8;
        background: var(--accent);
        font: inherit;
        font-weight: 800;
        cursor: pointer;
      }

      .load-more-action:hover:not(:disabled),
      .load-more-action:focus-visible:not(:disabled) {
        background: #0b5f59;
        outline: none;
      }

      .load-more-action:disabled {
        cursor: progress;
        background: rgba(15, 118, 110, 0.55);
      }

      .load-more-hint {
        margin: 0;
        color: var(--muted);
        font-size: 0.9rem;
      }

      .load-more-error {
        margin: 0.5rem 0 0;
        color: #b8423b;
        font-size: 0.92rem;
        text-align: center;
      }

      .external-card-actions {
        margin-top: auto;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        padding-top: 0.85rem;
        border-top: 1px dashed var(--line);
      }

      .tracking-label {
        max-width: 11.5rem;
        min-height: 1.9rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.15rem 0.65rem;
        border: 1px solid rgba(15, 118, 110, 0.28);
        border-radius: 999px;
        color: var(--accent);
        background: rgba(15, 118, 110, 0.1);
        font: inherit;
        font-size: 0.74rem;
        font-weight: 800;
        line-height: 1.15;
        text-align: center;
        cursor: pointer;
      }

      .tracking-label:hover:not(:disabled),
      .tracking-label:focus-visible:not(:disabled) {
        border-color: rgba(15, 118, 110, 0.44);
        background: rgba(15, 118, 110, 0.16);
        outline: none;
      }

      .tracking-label:disabled {
        cursor: progress;
        opacity: 0.65;
      }

      .external-status-tag {
        align-self: start;
        display: inline-flex;
        align-items: center;
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        font-size: 0.74rem;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        background: rgba(15, 118, 110, 0.16);
        color: var(--accent);
      }

      .external-status-tag.is-estado-aceptada {
        background: rgba(15, 118, 110, 0.22);
        color: #0b5f59;
      }

      .external-status-tag.is-estado-rechazada,
      .external-status-tag.is-estado-retirada {
        background: rgba(184, 79, 59, 0.16);
        color: #b8423b;
      }

      .tracking-toggle {
        max-width: 12rem;
        min-height: 1.85rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.15rem 0.7rem;
        border: 1px solid rgba(15, 118, 110, 0.28);
        border-radius: 999px;
        background: rgba(15, 118, 110, 0.16);
        color: var(--accent);
        font: inherit;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        line-height: 1.15;
        cursor: pointer;
      }

      .tracking-toggle.is-estado-aceptada {
        border-color: rgba(11, 95, 89, 0.4);
        background: rgba(15, 118, 110, 0.22);
        color: #0b5f59;
      }

      .tracking-label.is-primary {
        border-color: rgba(15, 118, 110, 0.55);
        background: var(--accent);
        color: #f7fbf8;
      }

      .tracking-label.is-primary:hover:not(:disabled),
      .tracking-label.is-primary:focus-visible:not(:disabled) {
        background: #0b5f59;
        border-color: #0b5f59;
        color: #f7fbf8;
      }

      .tracking-toggle .hover {
        display: none;
      }

      .tracking-toggle:hover:not(:disabled),
      .tracking-toggle:focus-visible:not(:disabled) {
        border-color: rgba(184, 79, 59, 0.5);
        background: rgba(184, 79, 59, 0.16);
        color: #b8423b;
        outline: none;
      }

      .tracking-toggle:hover:not(:disabled) .state,
      .tracking-toggle:focus-visible:not(:disabled) .state {
        display: none;
      }

      .tracking-toggle:hover:not(:disabled) .hover,
      .tracking-toggle:focus-visible:not(:disabled) .hover {
        display: inline;
      }

      .tracking-toggle:disabled {
        cursor: progress;
        opacity: 0.65;
      }

      .tracking-action {
        min-height: 2.3rem;
        padding: 0 0.85rem;
        border-radius: 0.45rem;
        font: inherit;
        font-size: 0.84rem;
        font-weight: 800;
        cursor: pointer;
      }

      .tracking-action.primary {
        border: 0;
        color: #f7fbf8;
        background: var(--accent);
      }

      .tracking-action.primary:hover:not(:disabled),
      .tracking-action.primary:focus-visible:not(:disabled) {
        background: #0b5f59;
        outline: none;
      }

      .tracking-action.secondary {
        border: 1px solid var(--line);
        color: var(--ink);
        background: rgba(255, 255, 255, 0.6);
      }

      .tracking-action.secondary:hover:not(:disabled),
      .tracking-action.secondary:focus-visible:not(:disabled) {
        border-color: rgba(15, 118, 110, 0.36);
        outline: none;
      }

      .tracking-action:disabled {
        cursor: progress;
        opacity: 0.65;
      }

      .adzuna-attribution {
        margin: 0.2rem 0 0;
        color: var(--muted);
        font-size: 0.85rem;
      }

      .adzuna-attribution a {
        color: var(--accent);
        font-weight: 700;
        text-decoration: none;
      }

      .adzuna-attribution a:hover,
      .adzuna-attribution a:focus-visible {
        text-decoration: underline;
        outline: none;
      }

      @media (max-width: 980px) {
        .filters-form {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .filter-actions {
          grid-column: 1 / -1;
        }
      }

      @media (max-width: 620px) {
        .practicas-page {
          padding-top: 1rem;
        }

        .filters-form,
        .offer-details {
          grid-template-columns: 1fr;
        }

        .filter-actions {
          display: grid;
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticasPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly ofertasService = inject(OfertasService);
  private readonly ofertasExternasService = inject(OfertasExternasService);
  private readonly solicitudesExternasService = inject(SolicitudesExternasService);
  private readonly preferenciasService = inject(AlumnoPreferenciasService);
  private readonly authService = inject(AuthService);
  private readonly cache = inject(PracticasCacheService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly status = signal<CatalogStatus>('loading');
  protected readonly ofertas = signal<OfertaFct[]>([]);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly externasStatus = signal<CatalogStatus>('loading');
  protected readonly ofertasExternas = signal<OfertaExterna[]>([]);
  protected readonly externasErrorMessage = signal<string | null>(null);
  protected readonly externasAttribution = signal<string>('Resultados ofrecidos por Adzuna');
  protected readonly externasAttributionUrl = signal<string>('https://www.adzuna.es/');
  protected readonly externasTotal = signal<number>(0);
  protected readonly externasPage = signal<number>(1);
  protected readonly externasLoadingMore = signal<boolean>(false);
  protected readonly mineExternas = signal<SolicitudExterna[]>([]);
  protected readonly externalActionInFlight = signal<string | null>(null);
  protected readonly externalActionError = signal<string | null>(null);
  protected readonly selectedExternalOffer = signal<OfertaExterna | null>(null);

  private static readonly EXTERNAS_PAGE_SIZE = 21;

  protected readonly modalidadOptions: ModalidadOption[] = [
    { value: 'PRESENCIAL', label: 'Presencial' },
    { value: 'HIBRIDA', label: 'Híbrida' },
    { value: 'REMOTA', label: 'Remota' },
  ];

  protected readonly familiaOptions = FAMILIAS_PROFESIONALES;
  protected readonly localidadOptions = LOCALIDADES_ES;

  protected readonly filtersForm = this.formBuilder.nonNullable.group({
    q: [''],
    familiaProfesional: [''],
    localidad: [''],
    modalidad: ['' as OfertaModalidad | ''],
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.status.set('loaded');
      this.externasStatus.set('loaded');
      return;
    }

    this.applyAlumnoPreferencesToFilters();
    this.loadMineExternas();
  }

  private applyAlumnoPreferencesToFilters(): void {
    const isAlumno = this.authService.currentUser()?.roles.includes('ALUMNO') ?? false;
    if (!isAlumno || !this.authService.accessToken()) {
      this.loadOffers();
      this.loadExternalOffers();
      return;
    }

    this.preferenciasService
      .getMine()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (preferences) => {
          const familia = preferences.familiaProfesional ?? '';
          const localidad = preferences.localidadPreferida ?? '';
          const familiaValida = this.familiaOptions.some((f) => f.value === familia) ? familia : '';
          const localidadValida = this.localidadOptions.includes(localidad) ? localidad : '';
          if (familiaValida || localidadValida) {
            this.filtersForm.patchValue({
              familiaProfesional: familiaValida,
              localidad: localidadValida,
            });
          }
          this.loadOffers();
          this.loadExternalOffers();
        },
        error: () => {
          this.loadOffers();
          this.loadExternalOffers();
        },
      });
  }

  protected search(): void {
    this.loadOffers(true);
    this.loadExternalOffers(true);
  }

  protected clearFilters(): void {
    this.filtersForm.reset({
      q: '',
      familiaProfesional: '',
      localidad: '',
      modalidad: '',
    });
    this.loadOffers(true);
    this.loadExternalOffers(true);
  }

  protected modalidadLabel(modalidad: OfertaModalidad): string {
    return this.modalidadOptions.find((option) => option.value === modalidad)?.label ?? modalidad;
  }

  protected resultsTitle(): string {
    const count = this.ofertas().length;
    return count === 1 ? '1 oferta disponible' : `${count} ofertas disponibles`;
  }

  protected externasResultsTitle(): string {
    const count = this.ofertasExternas().length;
    const total = this.externasTotal();
    if (count === 0) {
      return 'Sin coincidencias en fuentes externas';
    }
    if (total > count) {
      return `${count} de ${total} ofertas externas`;
    }
    return count === 1 ? '1 oferta externa' : `${count} ofertas externas`;
  }

  protected salaryLabel(oferta: OfertaExterna): string {
    const min = oferta.salarioMinimo;
    const max = oferta.salarioMaximo;
    const formatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
    const range = min != null && max != null && min !== max
      ? `${formatter.format(min)} - ${formatter.format(max)}`
      : formatter.format((max ?? min) ?? 0);
    return oferta.salarioEstimado ? `${range} (estimado)` : range;
  }

  protected openExternalDetail(oferta: OfertaExterna): void {
    this.selectedExternalOffer.set(oferta);
  }

  protected closeExternalDetail(): void {
    this.selectedExternalOffer.set(null);
  }

  private loadOffers(forceRefresh = false): void {
    const filters = this.currentFilters();
    const filtersKey = this.cache.buildFiltersKey(filters);

    if (!forceRefresh) {
      const cached = this.cache.getInternas(filtersKey);
      if (cached) {
        this.ofertas.set(cached.ofertas);
        this.errorMessage.set(null);
        this.status.set('loaded');
        return;
      }
    }

    this.status.set('loading');
    this.errorMessage.set(null);

    this.ofertasService
      .list(filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ofertas) => {
          const filteredOffers = this.applyClientSideFilters(ofertas, filters);
          this.ofertas.set(filteredOffers);
          this.cache.setInternas({ filtersKey, ofertas: filteredOffers });
          this.status.set('loaded');
        },
        error: (error: unknown) => {
          this.ofertas.set([]);
          this.errorMessage.set(catalogErrorMessage(error));
          this.status.set('error');
        },
      });
  }

  protected solicitudFor(oferta: OfertaExterna): SolicitudExterna | null {
    return this.mineExternas().find(
      (item) => item.fuente === oferta.fuente && item.idExterno === oferta.id,
    ) ?? null;
  }

  protected externalActionKey(oferta: OfertaExterna): string {
    return `${oferta.fuente}:${oferta.id}`;
  }

  protected isExternalActionInFlight(oferta: OfertaExterna): boolean {
    return this.externalActionInFlight() === this.externalActionKey(oferta);
  }

  protected estadoLabel(estado: SolicitudExternaEstado): string {
    switch (estado) {
      case 'SOLICITADA': return 'Solicitada';
      case 'ACEPTADA': return 'Aceptada';
      case 'RECHAZADA': return 'Rechazada';
      case 'RETIRADA': return 'Retirada';
      default: return estado;
    }
  }

  protected estadoModifierClass(estado: SolicitudExternaEstado): string {
    return `is-estado-${estado.toLowerCase()}`;
  }

  protected canMarkAsSolicitada(oferta: OfertaExterna): boolean {
    const current = this.solicitudFor(oferta);
    return current === null
      || current.estado === 'RETIRADA'
      || current.estado === 'RECHAZADA';
  }

  protected markAsSolicitada(oferta: OfertaExterna): void {
    if (this.isExternalActionInFlight(oferta)) {
      return;
    }
    this.runExternalAction(oferta, this.solicitudesExternasService.create({
      fuente: 'ADZUNA',
      idExterno: oferta.id,
      titulo: oferta.titulo,
      empresaNombre: oferta.empresaNombre ?? null,
      localidad: oferta.localidad ?? null,
      region: oferta.region ?? null,
      urlAplicacion: oferta.urlAplicacion,
      publicadoEn: oferta.publicadoEn ?? null,
      categoria: oferta.categoria ?? null,
    }));
  }

  protected markAsAceptada(oferta: OfertaExterna): void {
    const current = this.solicitudFor(oferta);
    if (!current || this.isExternalActionInFlight(oferta) || !this.confirmExternalAcceptance()) {
      return;
    }
    this.runExternalAction(
      oferta,
      this.solicitudesExternasService.changeEstado(current.id, 'ACEPTADA'),
    );
  }

  protected retirarSolicitud(oferta: OfertaExterna): void {
    const current = this.solicitudFor(oferta);
    if (!current || this.isExternalActionInFlight(oferta)) {
      return;
    }
    this.runExternalAction(
      oferta,
      this.solicitudesExternasService.changeEstado(current.id, 'RETIRADA'),
    );
  }

  protected anularSolicitud(oferta: OfertaExterna): void {
    const current = this.solicitudFor(oferta);
    if (!current || this.isExternalActionInFlight(oferta)) {
      return;
    }
    if (!this.confirmAnular(current.estado)) {
      return;
    }
    this.runExternalAction(
      oferta,
      this.solicitudesExternasService.changeEstado(current.id, 'RETIRADA'),
    );
  }

  private confirmAnular(estado: SolicitudExternaEstado): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    const detalle = estado === 'ACEPTADA'
      ? 'Esta solicitud está marcada como aceptada. Si la anulas, deberás volver a marcarla si la empresa te confirma de nuevo.'
      : 'La solicitud quedará marcada como retirada y se ocultará del seguimiento activo.';
    return window.confirm(`¿Anular la solicitud? ${detalle}`);
  }

  private runExternalAction(
    oferta: OfertaExterna,
    request$: import('rxjs').Observable<SolicitudExterna>,
  ): void {
    this.externalActionInFlight.set(this.externalActionKey(oferta));
    this.externalActionError.set(null);
    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.upsertMineExterna(updated);
          this.externalActionInFlight.set(null);
        },
        error: (error: unknown) => {
          this.externalActionInFlight.set(null);
          this.externalActionError.set(externalCatalogErrorMessage(error));
        },
      });
  }

  private upsertMineExterna(solicitud: SolicitudExterna): void {
    this.mineExternas.update((existing) => {
      const idx = existing.findIndex(
        (item) => item.fuente === solicitud.fuente && item.idExterno === solicitud.idExterno,
      );
      if (idx === -1) {
        return [solicitud, ...existing];
      }
      const next = existing.slice();
      next[idx] = solicitud;
      return next;
    });
    this.cache.setMineExternas(this.mineExternas());
  }

  private loadMineExternas(): void {
    const cached = this.cache.getMineExternas();
    if (cached) {
      this.mineExternas.set(cached);
      return;
    }

    this.solicitudesExternasService
      .mine()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.mineExternas.set(items);
          this.cache.setMineExternas(items);
        },
        error: () => {
          this.mineExternas.set([]);
        },
      });
  }

  private confirmExternalAcceptance(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    return window.confirm(
      'Confirma solo si la empresa externa te ha aceptado. Tu tutor podra crear la asignacion FCT desde esta solicitud.',
    );
  }

  protected loadMoreExternalOffers(): void {
    if (this.externasLoadingMore() || !this.canLoadMoreExternal()) {
      return;
    }
    this.fetchExternalOffers(this.externasPage() + 1, true);
  }

  protected canLoadMoreExternal(): boolean {
    return this.ofertasExternas().length < this.externasTotal();
  }

  protected externasLoadingMoreError(): boolean {
    return this.externasStatus() === 'loaded' && this.externasErrorMessage() !== null;
  }

  private loadExternalOffers(forceRefresh = false): void {
    const filters = this.currentFilters();
    if (this.hasExternalUnsupportedFilters(filters)) {
      this.ofertasExternas.set([]);
      this.externasTotal.set(0);
      this.externasPage.set(1);
      this.externasErrorMessage.set(null);
      this.externasStatus.set('loaded');
      this.externasLoadingMore.set(false);
      return;
    }

    const filtersKey = this.cache.buildFiltersKey(filters);

    if (!forceRefresh) {
      const cached = this.cache.getExternas(filtersKey);
      if (cached) {
        this.ofertasExternas.set(cached.ofertas);
        this.externasTotal.set(cached.total);
        this.externasPage.set(cached.page);
        this.externasAttribution.set(cached.attribution);
        this.externasAttributionUrl.set(cached.attributionUrl);
        this.externasErrorMessage.set(null);
        this.externasStatus.set('loaded');
        return;
      }
    }

    this.externasPage.set(1);
    this.fetchExternalOffers(1, false);
  }

  private fetchExternalOffers(page: number, append: boolean): void {
    if (append) {
      this.externasLoadingMore.set(true);
    } else {
      this.externasStatus.set('loading');
      this.externasErrorMessage.set(null);
    }

    const filters = this.currentFilters();
    const adzunaCategory = this.familiaOptions.find(
      (option) => option.value === filters.familiaProfesional,
    )?.adzunaCategory;

    this.ofertasExternasService
      .list({
        q: filters.q,
        where: filters.localidad,
        category: adzunaCategory ?? undefined,
        page,
        resultsPerPage: PracticasPage.EXTERNAS_PAGE_SIZE,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: OfertaExternaPage) => {
          this.ofertasExternas.update((existing) =>
            append ? [...existing, ...response.results] : response.results,
          );
          this.externasTotal.set(response.totalResults);
          this.externasPage.set(page);
          if (response.attribution) {
            this.externasAttribution.set(response.attribution);
          }
          if (response.attributionUrl) {
            this.externasAttributionUrl.set(response.attributionUrl);
          }
          this.externasStatus.set('loaded');
          this.externasLoadingMore.set(false);
          this.cache.setExternas({
            filtersKey: this.cache.buildFiltersKey(filters),
            ofertas: this.ofertasExternas(),
            page,
            total: response.totalResults,
            attribution: this.externasAttribution(),
            attributionUrl: this.externasAttributionUrl(),
          });
        },
        error: (error: unknown) => {
          if (append) {
            this.externasLoadingMore.set(false);
            this.externasErrorMessage.set(externalCatalogErrorMessage(error));
          } else {
            this.ofertasExternas.set([]);
            this.externasTotal.set(0);
            this.externasErrorMessage.set(externalCatalogErrorMessage(error));
            this.externasStatus.set('error');
          }
        },
      });
  }

  private currentFilters(): OfertaFctFilters {
    const rawFilters = this.filtersForm.getRawValue();

    return {
      q: rawFilters.q.trim(),
      familiaProfesional: rawFilters.familiaProfesional.trim(),
      localidad: rawFilters.localidad.trim(),
      modalidad: rawFilters.modalidad || undefined,
    };
  }

  protected hasExternalUnsupportedFilters(filters: OfertaFctFilters = this.currentFilters()): boolean {
    return Boolean(filters.modalidad);
  }

  private applyClientSideFilters(ofertas: OfertaFct[], filters: OfertaFctFilters): OfertaFct[] {
    const normalizedQuery = normalizeText(filters.q);
    const normalizedFamilia = normalizeText(filters.familiaProfesional);
    const normalizedLocalidad = normalizeText(filters.localidad);

    return ofertas.filter((oferta) => {
      if (filters.modalidad && oferta.modalidad !== filters.modalidad) {
        return false;
      }

      if (normalizedFamilia && normalizeText(oferta.familiaProfesional) !== normalizedFamilia) {
        return false;
      }

      if (normalizedLocalidad && normalizeText(oferta.localidad) !== normalizedLocalidad) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        oferta.titulo,
        oferta.empresaNombre,
        oferta.descripcion,
        oferta.tareas,
      ].some((field) => normalizeText(field).includes(normalizedQuery));
    });
  }
}

function catalogErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 401) {
      return 'Inicia sesión para consultar el catálogo de ofertas FCT.';
    }

    if (error.status === 0) {
      return 'No se pudo contactar con el backend. Comprueba que el servidor esté disponible.';
    }
  }

  return 'Inténtalo de nuevo o ajusta los filtros de búsqueda.';
}

function externalCatalogErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 401) {
      return 'Inicia sesión para consultar las ofertas externas.';
    }
    if (error.status === 503) {
      return 'La fuente externa no está disponible ahora mismo. Vuelve a intentarlo en unos minutos.';
    }
    if (error.status === 0) {
      return 'No se pudo contactar con el backend para obtener ofertas externas.';
    }
  }

  return 'No se pudieron obtener ofertas externas. Inténtalo de nuevo más tarde.';
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}
