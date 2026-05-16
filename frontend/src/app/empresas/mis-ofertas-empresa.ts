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
import { RouterLink } from '@angular/router';
import { OfertaEstado, OfertaFct, OfertaModalidad } from '../practicas/ofertas.models';
import { EmpresaOfertasService } from './empresa-ofertas.service';

type ListStatus = 'loading' | 'loaded' | 'empty' | 'error' | 'not-authenticated';

@Component({
  selector: 'app-mis-ofertas-empresa-page',
  imports: [RouterLink],
  template: `
    <main class="page-shell route-page mis-ofertas-page">
      <div class="actions-row">
        <a class="primary-action" routerLink="/empresa/ofertas/nueva">Crear oferta</a>
      </div>

      @if (status() === 'loading') {
        <section class="state-panel" aria-live="polite">
          <p class="eyebrow">Cargando</p>
          <h2>Recuperando tus ofertas</h2>
          <p>Estamos consultando las ofertas registradas por tu empresa.</p>
        </section>
      } @else if (status() === 'not-authenticated') {
        <section class="state-panel alert" role="alert">
          <p class="eyebrow">Sesion no disponible</p>
          <h2>Inicia sesion para gestionar tus ofertas</h2>
          <p>Necesitas una sesion activa de empresa para gestionar tus ofertas FCT.</p>
          <a class="back-link" routerLink="/login">Ir al acceso</a>
        </section>
      } @else if (status() === 'error') {
        <section class="state-panel alert" role="alert">
          <p class="eyebrow">Error</p>
          <h2>No se pudieron cargar tus ofertas</h2>
          <p>{{ errorMessage() }}</p>
        </section>
      } @else if (status() === 'empty') {
        <section class="state-panel">
          <p class="eyebrow">Sin ofertas</p>
          <h2>Aun no has registrado ninguna oferta FCT</h2>
          <p>Crea una nueva oferta para comenzar a recibir solicitudes de alumnos.</p>
        </section>
      } @else {
        <section class="ofertas-results" aria-live="polite" aria-label="Mis ofertas FCT">
          <div class="results-heading">
            <p class="eyebrow">Ofertas registradas</p>
            <h2>{{ resultsTitle() }}</h2>
          </div>

          <div class="ofertas-grid">
            @for (oferta of ofertas(); track oferta.id) {
              <article class="oferta-card">
                <div class="oferta-card-heading">
                  <span class="estado-pill" [attr.data-estado]="oferta.estado">
                    {{ estadoLabel(oferta.estado) }}
                  </span>
                  <h3>{{ oferta.titulo }}</h3>
                  <p class="oferta-meta">
                    {{ modalidadLabel(oferta.modalidad) }} · {{ oferta.localidad }},
                    {{ oferta.provincia }} · {{ oferta.plazas }} plazas
                  </p>
                  <p class="oferta-fechas">
                    {{ formatFecha(oferta.fechaInicio) }} →
                    {{ formatFecha(oferta.fechaFin) }}
                  </p>
                </div>

                <p class="oferta-description">{{ oferta.descripcion }}</p>

                <div class="oferta-actions" aria-label="Acciones disponibles">
                  @if (oferta.estado === 'BORRADOR') {
                    <a
                      class="secondary-action"
                      [routerLink]="['/empresa/ofertas', oferta.id, 'editar']"
                    >
                      Editar
                    </a>
                    <button
                      type="button"
                      class="primary-action"
                      [disabled]="isUpdating(oferta.id)"
                      (click)="publicar(oferta)"
                    >
                      Publicar
                    </button>
                    <button
                      type="button"
                      class="danger-action"
                      [disabled]="isUpdating(oferta.id)"
                      (click)="eliminar(oferta)"
                    >
                      Eliminar
                    </button>
                  } @else if (oferta.estado === 'PUBLICADA') {
                    <button
                      type="button"
                      class="secondary-action"
                      [disabled]="isUpdating(oferta.id)"
                      (click)="cerrar(oferta)"
                    >
                      Cerrar
                    </button>
                  }
                </div>
              </article>
            }
          </div>
        </section>
      }

      @if (actionMessage(); as msg) {
        <p class="action-feedback" role="status">{{ msg }}</p>
      }
    </main>
  `,
  styles: [
    `
      .mis-ofertas-page {
        align-content: start;
        gap: 1rem;
        padding-top: 2rem;
      }

      .actions-row {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .primary-action,
      .secondary-action,
      .danger-action,
      .back-link {
        min-height: 2.5rem;
        display: inline-flex;
        align-items: center;
        padding: 0 0.85rem;
        border-radius: var(--radius-md);
        font-weight: 800;
        text-decoration: none;
        cursor: pointer;
        font: inherit;
      }

      .primary-action {
        border: 0;
        color: #ffffff;
        background: var(--accent);
      }

      .primary-action:hover:not([disabled]),
      .primary-action:focus-visible:not([disabled]) {
        background: var(--accent-hover);
        outline: none;
      }

      .secondary-action {
        border: 1px solid var(--line);
        color: var(--ink);
        background: var(--surface-muted);
      }

      .secondary-action:hover:not([disabled]),
      .secondary-action:focus-visible:not([disabled]) {
        border-color: var(--line-strong);
        outline: none;
      }

      .danger-action {
        border: 1px solid rgba(179, 38, 30, 0.4);
        color: var(--danger);
        background: var(--danger-soft);
      }

      .danger-action:hover:not([disabled]),
      .danger-action:focus-visible:not([disabled]) {
        border-color: rgba(179, 38, 30, 0.65);
        filter: brightness(0.96);
        outline: none;
      }

      :host-context(.theme-dark) .danger-action {
        border-color: rgba(255, 138, 128, 0.42);
      }

      :host-context(.theme-dark) .danger-action:hover:not([disabled]),
      :host-context(.theme-dark) .danger-action:focus-visible:not([disabled]) {
        border-color: rgba(255, 138, 128, 0.62);
        filter: brightness(1.1);
      }

      [disabled] {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .state-panel {
        padding: 1.2rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--surface);
        box-shadow: var(--shadow-soft);
      }

      .state-panel p:not(.eyebrow) {
        margin: 0.7rem 0 0;
        color: var(--muted);
        line-height: 1.65;
      }

      .state-panel.alert {
        border-color: rgba(179, 38, 30, 0.28);
        background: var(--danger-soft);
      }

      :host-context(.theme-dark) .state-panel.alert {
        border-color: rgba(255, 138, 128, 0.4);
      }

      .state-panel h2,
      .results-heading h2 {
        margin: 0;
        font-size: 1.45rem;
        font-family: inherit;
        line-height: 1.2;
      }

      .results-heading {
        display: grid;
        gap: 0.35rem;
      }

      .ofertas-results {
        display: grid;
        gap: 1rem;
      }

      .ofertas-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
        gap: 1rem;
      }

      .oferta-card {
        display: grid;
        gap: 0.85rem;
        padding: 1rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--surface);
        box-shadow: var(--shadow-soft);
      }

      .oferta-card-heading {
        display: grid;
        gap: 0.45rem;
      }

      .oferta-card h3 {
        margin: 0;
        font-family: inherit;
        font-size: 1.2rem;
        line-height: 1.25;
      }

      .oferta-meta,
      .oferta-fechas {
        margin: 0;
        color: var(--muted);
        font-size: 0.92rem;
      }

      .oferta-description {
        margin: 0;
        color: var(--ink);
        line-height: 1.55;
      }

      .estado-pill {
        align-self: start;
        display: inline-flex;
        align-items: center;
        min-height: 1.85rem;
        padding: 0 0.7rem;
        border-radius: var(--radius-sm);
        font-size: 0.78rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .estado-pill[data-estado='BORRADOR'] {
        background: rgba(120, 113, 108, 0.16);
        color: #44403c;
      }

      .estado-pill[data-estado='PUBLICADA'] {
        background: rgba(17, 78, 74, 0.18);
        color: var(--accent-hover);
      }

      .estado-pill[data-estado='CERRADA'] {
        background: rgba(179, 38, 30, 0.18);
        color: var(--danger);
      }

      .estado-pill[data-estado='PENDIENTE_REVISION'],
      .estado-pill[data-estado='RECHAZADA'],
      .estado-pill[data-estado='ARCHIVADA'] {
        background: rgba(146, 64, 14, 0.16);
        color: #7c2d12;
      }

      .oferta-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .action-feedback {
        margin: 0;
        color: var(--muted);
        font-style: italic;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MisOfertasEmpresaPage implements OnInit {
  private readonly empresaOfertasService = inject(EmpresaOfertasService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly status = signal<ListStatus>('loading');
  protected readonly ofertas = signal<OfertaFct[]>([]);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly actionMessage = signal<string | null>(null);
  protected readonly updatingId = signal<number | null>(null);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.status.set('not-authenticated');
      return;
    }

    this.loadOfertas();
  }

  protected isUpdating(id: number): boolean {
    return this.updatingId() === id;
  }

  protected publicar(oferta: OfertaFct): void {
    this.changeEstado(oferta, 'PUBLICADA', 'Oferta publicada');
  }

  protected cerrar(oferta: OfertaFct): void {
    this.changeEstado(oferta, 'CERRADA', 'Oferta cerrada');
  }

  protected eliminar(oferta: OfertaFct): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (!confirm(`Eliminar el borrador "${oferta.titulo}"? Esta accion no se puede deshacer.`)) {
      return;
    }

    this.updatingId.set(oferta.id);
    this.actionMessage.set(null);

    this.empresaOfertasService
      .delete(oferta.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.actionMessage.set('Oferta eliminada');
          this.updatingId.set(null);
          this.loadOfertas();
        },
        error: (error: unknown) => {
          this.actionMessage.set(actionErrorMessage(error));
          this.updatingId.set(null);
        },
      });
  }

  protected estadoLabel(estado: OfertaEstado): string {
    return ESTADO_LABELS[estado] ?? estado;
  }

  protected modalidadLabel(modalidad: OfertaModalidad): string {
    return MODALIDAD_LABELS[modalidad] ?? modalidad;
  }

  protected formatFecha(value: string): string {
    if (!isPlatformBrowser(this.platformId)) {
      return value;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  protected resultsTitle(): string {
    const count = this.ofertas().length;
    return count === 1 ? '1 oferta registrada' : `${count} ofertas registradas`;
  }

  private changeEstado(oferta: OfertaFct, destino: OfertaEstado, success: string): void {
    this.updatingId.set(oferta.id);
    this.actionMessage.set(null);

    this.empresaOfertasService
      .changeEstado(oferta.id, destino)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.ofertas.update((current) =>
            current.map((item) => (item.id === updated.id ? updated : item)),
          );
          this.actionMessage.set(success);
          this.updatingId.set(null);
        },
        error: (error: unknown) => {
          this.actionMessage.set(actionErrorMessage(error));
          this.updatingId.set(null);
        },
      });
  }

  private loadOfertas(): void {
    this.status.set('loading');
    this.errorMessage.set(null);

    this.empresaOfertasService
      .listMine()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ofertas) => {
          this.ofertas.set(ofertas);
          this.status.set(ofertas.length === 0 ? 'empty' : 'loaded');
        },
        error: (error: unknown) => {
          this.ofertas.set([]);
          if (isUnauthorized(error)) {
            this.status.set('not-authenticated');
            return;
          }
          this.errorMessage.set(listErrorMessage(error));
          this.status.set('error');
        },
      });
  }
}

const ESTADO_LABELS: Record<OfertaEstado, string> = {
  BORRADOR: 'Borrador',
  PENDIENTE_REVISION: 'Pendiente revision',
  PUBLICADA: 'Publicada',
  CERRADA: 'Cerrada',
  RECHAZADA: 'Rechazada',
  ARCHIVADA: 'Archivada',
};

const MODALIDAD_LABELS: Record<OfertaModalidad, string> = {
  PRESENCIAL: 'Presencial',
  HIBRIDA: 'Hibrida',
  REMOTA: 'Remota',
};

function isUnauthorized(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 401;
}

function listErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No se pudo contactar con el servidor. Comprueba que el backend este disponible.';
    }
    if (error.status === 403) {
      return 'No tienes una empresa vinculada o no tienes permisos para gestionar ofertas.';
    }
  }
  return 'No se pudieron cargar las ofertas. Intentalo de nuevo.';
}

function actionErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 409) {
      return 'No se pudo completar la accion: el estado actual no lo permite.';
    }
    if (error.status === 403) {
      return 'No tienes permisos para esta accion.';
    }
    if (error.status === 404) {
      return 'La oferta ya no existe o no pertenece a tu empresa.';
    }
  }
  return 'No se pudo completar la accion. Intentalo de nuevo.';
}
