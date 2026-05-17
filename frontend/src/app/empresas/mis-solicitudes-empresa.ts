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
import { SolicitudEstado } from '../practicas/solicitudes.models';
import { EmpresaSolicitud } from './empresa-solicitudes.models';
import { EmpresaSolicitudesService } from './empresa-solicitudes.service';
import { MisSolicitudesEmpresaCacheService } from './mis-solicitudes-empresa-cache.service';

type ListStatus = 'loading' | 'loaded' | 'empty' | 'error' | 'not-authenticated';

@Component({
  selector: 'app-mis-solicitudes-empresa-page',
  imports: [RouterLink],
  template: `
    <main class="page-shell route-page mis-solicitudes-empresa-page">
      @if (status() === 'loading') {
        <section class="state-panel" aria-live="polite">
          <p class="eyebrow">Cargando</p>
          <h2>Recuperando las solicitudes recibidas</h2>
          <p>Estamos consultando las solicitudes enviadas a tus ofertas FCT.</p>
        </section>
      } @else if (status() === 'not-authenticated') {
        <section class="state-panel alert" role="alert">
          <p class="eyebrow">Sesion no disponible</p>
          <h2>Inicia sesion para gestionar las solicitudes</h2>
          <p>Necesitas una sesion activa de empresa para ver las solicitudes recibidas.</p>
          <a class="back-link" routerLink="/login">Ir al acceso</a>
        </section>
      } @else if (status() === 'error') {
        <section class="state-panel alert" role="alert">
          <p class="eyebrow">Error</p>
          <h2>No se pudieron cargar las solicitudes</h2>
          <p>{{ errorMessage() }}</p>
        </section>
      } @else if (status() === 'empty') {
        <section class="state-panel">
          <p class="eyebrow">Sin solicitudes</p>
          <h2>Aun no has recibido solicitudes</h2>
          <p>Publica una oferta y comparte el catalogo con alumnos para empezar a recibirlas.</p>
        </section>
      } @else {
        <section
          class="solicitudes-results"
          aria-live="polite"
          aria-label="Solicitudes recibidas"
        >
          <div class="results-heading">
            <p class="eyebrow">Solicitudes recibidas</p>
            <h2>{{ resultsTitle() }}</h2>
          </div>

          <div class="solicitudes-grid">
            @for (solicitud of solicitudes(); track solicitud.id) {
              <article class="solicitud-card">
                <div class="solicitud-card-heading">
                  <span class="estado-pill" [attr.data-estado]="solicitud.estado">
                    {{ estadoLabel(solicitud.estado) }}
                  </span>
                  <h3>{{ solicitud.alumno.displayName }}</h3>
                  <p class="solicitud-email">{{ solicitud.alumno.email }}</p>
                </div>

                <dl class="solicitud-details" aria-label="Datos de la solicitud">
                  <div>
                    <dt>Oferta</dt>
                    <dd>{{ solicitud.oferta.titulo }}</dd>
                  </div>
                  <div>
                    <dt>Fecha</dt>
                    <dd>{{ formatFecha(solicitud.createdAt) }}</dd>
                  </div>
                </dl>

                @if (solicitud.estado === 'SOLICITADA') {
                  <div class="solicitud-actions" aria-label="Acciones disponibles">
                    <button
                      type="button"
                      class="primary-action"
                      [disabled]="isUpdating(solicitud.id)"
                      (click)="aceptar(solicitud)"
                    >
                      Aceptar
                    </button>
                    <button
                      type="button"
                      class="danger-action"
                      [disabled]="isUpdating(solicitud.id)"
                      (click)="rechazar(solicitud)"
                    >
                      Rechazar
                    </button>
                  </div>
                }
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
      .mis-solicitudes-empresa-page {
        align-content: start;
        gap: 1rem;
        padding-top: 2rem;
      }

      .state-panel {
        max-width: 46rem;
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
        background: rgba(255, 246, 241, 0.9);
      }

      .state-panel h2,
      .results-heading h2 {
        margin: 0;
        font-family: inherit;
        font-size: 1.45rem;
        line-height: 1.2;
      }

      .results-heading {
        display: grid;
        gap: 0.35rem;
      }

      .solicitudes-results {
        display: grid;
        gap: 1rem;
      }

      .solicitudes-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
        gap: 1rem;
      }

      .solicitud-card {
        display: grid;
        gap: 0.85rem;
        padding: 1rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: rgba(255, 251, 245, 0.72);
        box-shadow: var(--shadow-soft);
      }

      .solicitud-card-heading {
        display: grid;
        gap: 0.45rem;
      }

      .solicitud-card h3 {
        margin: 0;
        font-family: inherit;
        font-size: 1.15rem;
        line-height: 1.25;
      }

      .solicitud-email {
        margin: 0;
        color: var(--muted);
        font-size: 0.92rem;
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

      .estado-pill[data-estado='SOLICITADA'] {
        background: rgba(17, 78, 74, 0.18);
        color: var(--accent-hover);
      }

      .estado-pill[data-estado='ACEPTADA'] {
        background: rgba(29, 107, 74, 0.18);
        color: var(--success);
      }

      .estado-pill[data-estado='RECHAZADA'] {
        background: rgba(179, 38, 30, 0.18);
        color: var(--danger);
      }

      .solicitud-details {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.65rem;
        margin: 0;
      }

      .solicitud-details dt {
        color: var(--muted);
        font-size: 0.78rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .solicitud-details dd {
        margin: 0.2rem 0 0;
        color: var(--ink);
        font-weight: 700;
        line-height: 1.35;
      }

      .solicitud-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .primary-action,
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

      .danger-action {
        border: 1px solid rgba(179, 38, 30, 0.4);
        color: #8a3a25;
        background: rgba(255, 246, 241, 0.92);
      }

      .danger-action:hover:not([disabled]),
      .danger-action:focus-visible:not([disabled]) {
        border-color: rgba(179, 38, 30, 0.65);
        outline: none;
      }

      [disabled] {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .back-link {
        margin-top: 0.4rem;
        border: 1px solid var(--line);
        color: var(--ink);
        background: var(--surface-muted);
      }

      .back-link:hover,
      .back-link:focus-visible {
        border-color: rgba(17, 78, 74, 0.36);
        outline: none;
      }

      .action-feedback {
        margin: 0;
        color: var(--muted);
        font-style: italic;
      }

      @media (max-width: 620px) {
        .mis-solicitudes-empresa-page {
          padding-top: 1rem;
        }

        .solicitud-details {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MisSolicitudesEmpresaPage implements OnInit {
  private readonly empresaSolicitudesService = inject(EmpresaSolicitudesService);
  private readonly cache = inject(MisSolicitudesEmpresaCacheService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly status = signal<ListStatus>('loading');
  protected readonly solicitudes = signal<EmpresaSolicitud[]>([]);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly actionMessage = signal<string | null>(null);
  protected readonly updatingId = signal<number | null>(null);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.status.set('not-authenticated');
      return;
    }

    this.loadSolicitudes();
  }

  protected isUpdating(id: number): boolean {
    return this.updatingId() === id;
  }

  protected aceptar(solicitud: EmpresaSolicitud): void {
    this.changeEstado(solicitud, 'ACEPTADA', 'Solicitud aceptada');
  }

  protected rechazar(solicitud: EmpresaSolicitud): void {
    this.changeEstado(solicitud, 'RECHAZADA', 'Solicitud rechazada');
  }

  protected estadoLabel(estado: SolicitudEstado): string {
    return ESTADO_LABELS[estado] ?? estado;
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
    const count = this.solicitudes().length;
    return count === 1 ? '1 solicitud recibida' : `${count} solicitudes recibidas`;
  }

  private changeEstado(
    solicitud: EmpresaSolicitud,
    destino: SolicitudEstado,
    success: string,
  ): void {
    this.updatingId.set(solicitud.id);
    this.actionMessage.set(null);

    this.empresaSolicitudesService
      .changeEstado(solicitud.id, destino)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.solicitudes.update((current) =>
            current.map((item) => (item.id === updated.id ? updated : item)),
          );
          this.cache.update((items) =>
            items.map((item) => (item.id === updated.id ? updated : item)),
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

  private loadSolicitudes(forceRefresh = false): void {
    if (!forceRefresh) {
      const cached = this.cache.get();
      if (cached) {
        this.solicitudes.set(cached);
        this.errorMessage.set(null);
        this.status.set(cached.length === 0 ? 'empty' : 'loaded');
        return;
      }
    }

    this.status.set('loading');
    this.errorMessage.set(null);

    this.empresaSolicitudesService
      .listMine()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (solicitudes) => {
          this.cache.set(solicitudes);
          this.solicitudes.set(solicitudes);
          this.status.set(solicitudes.length === 0 ? 'empty' : 'loaded');
        },
        error: (error: unknown) => {
          this.solicitudes.set([]);
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

const ESTADO_LABELS: Record<SolicitudEstado, string> = {
  SOLICITADA: 'Solicitada',
  ACEPTADA: 'Aceptada',
  RECHAZADA: 'Rechazada',
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
      return 'No tienes una empresa vinculada o no tienes permisos para gestionar solicitudes.';
    }
  }
  return 'No se pudieron cargar las solicitudes. Intentalo de nuevo.';
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
      return 'La solicitud ya no existe o no pertenece a tu empresa.';
    }
  }
  return 'No se pudo completar la accion. Intentalo de nuevo.';
}
