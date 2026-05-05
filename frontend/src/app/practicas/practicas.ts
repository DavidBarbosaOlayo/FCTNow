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
import { OfertaFct, OfertaFctFilters, OfertaModalidad } from './ofertas.models';
import { OfertasService } from './ofertas.service';

type CatalogStatus = 'loading' | 'loaded' | 'error';

type ModalidadOption = {
  value: OfertaModalidad;
  label: string;
};

@Component({
  selector: 'app-practicas-page',
  imports: [ReactiveFormsModule, RouterLink],
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
            <input
              id="practicas-familia"
              type="text"
              formControlName="familiaProfesional"
              placeholder="Informática y comunicaciones"
            />
          </div>

          <div class="filter-field">
            <label for="practicas-localidad">Localidad</label>
            <input
              id="practicas-localidad"
              type="text"
              formControlName="localidad"
              placeholder="Valencia"
            />
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
        display: grid;
        gap: 1rem;
        min-height: 100%;
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
        justify-self: start;
        min-height: 2.5rem;
        display: inline-flex;
        align-items: center;
        padding: 0 0.85rem;
        border-radius: 0.5rem;
        color: #f7fbf8;
        background: var(--accent);
        font-weight: 800;
        text-decoration: none;
      }

      .offer-link:hover,
      .offer-link:focus-visible {
        background: #0b5f59;
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly status = signal<CatalogStatus>('loading');
  protected readonly ofertas = signal<OfertaFct[]>([]);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly modalidadOptions: ModalidadOption[] = [
    { value: 'PRESENCIAL', label: 'Presencial' },
    { value: 'HIBRIDA', label: 'Híbrida' },
    { value: 'REMOTA', label: 'Remota' },
  ];

  protected readonly filtersForm = this.formBuilder.nonNullable.group({
    q: [''],
    familiaProfesional: [''],
    localidad: [''],
    modalidad: ['' as OfertaModalidad | ''],
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.status.set('loaded');
      return;
    }

    this.loadOffers();
  }

  protected search(): void {
    this.loadOffers();
  }

  protected clearFilters(): void {
    this.filtersForm.reset({
      q: '',
      familiaProfesional: '',
      localidad: '',
      modalidad: '',
    });
    this.loadOffers();
  }

  protected modalidadLabel(modalidad: OfertaModalidad): string {
    return this.modalidadOptions.find((option) => option.value === modalidad)?.label ?? modalidad;
  }

  protected resultsTitle(): string {
    const count = this.ofertas().length;
    return count === 1 ? '1 oferta disponible' : `${count} ofertas disponibles`;
  }

  private loadOffers(): void {
    this.status.set('loading');
    this.errorMessage.set(null);

    this.ofertasService
      .list(this.currentFilters())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ofertas) => {
          this.ofertas.set(ofertas);
          this.status.set('loaded');
        },
        error: (error: unknown) => {
          this.ofertas.set([]);
          this.errorMessage.set(catalogErrorMessage(error));
          this.status.set('error');
        },
      });
  }

  private currentFilters(): OfertaFctFilters {
    const rawFilters = this.filtersForm.getRawValue();

    return {
      q: rawFilters.q,
      familiaProfesional: rawFilters.familiaProfesional,
      localidad: rawFilters.localidad,
      modalidad: rawFilters.modalidad || undefined,
    };
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
