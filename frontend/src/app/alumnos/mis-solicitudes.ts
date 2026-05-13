import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import {
  SolicitudExterna,
  SolicitudExternaEstado,
} from '../practicas/solicitudes-externas.models';
import { PracticasCacheService } from '../practicas/practicas-cache.service';
import { SolicitudesExternasService } from '../practicas/solicitudes-externas.service';
import { SolicitudEstado, SolicitudFct } from '../practicas/solicitudes.models';
import { SolicitudesService } from '../practicas/solicitudes.service';

type ListStatus = 'loading' | 'loaded' | 'empty' | 'error' | 'not-authenticated';

@Component({
  selector: 'app-mis-solicitudes-page',
  imports: [RouterLink],
  template: `
    <main class="page-shell route-page mis-solicitudes-page">
      @if (status() === 'loading') {
        <section class="state-panel" aria-live="polite">
          <p class="eyebrow">Cargando</p>
          <h2>Recuperando tus solicitudes</h2>
          <p>Estamos consultando las ofertas a las que te has presentado.</p>
        </section>
      } @else if (status() === 'not-authenticated') {
        <section class="state-panel alert" role="alert">
          <p class="eyebrow">Sesión no disponible</p>
          <h2>Inicia sesión para ver tus solicitudes</h2>
          <p>Necesitas una sesión activa para consultar las ofertas que has solicitado.</p>
          <a class="back-link" routerLink="/login">Ir al acceso</a>
        </section>
      } @else if (status() === 'error') {
        <section class="state-panel alert" role="alert">
          <p class="eyebrow">Error</p>
          <h2>No se pudieron cargar tus solicitudes</h2>
          <p>{{ errorMessage() }}</p>
        </section>
      } @else if (status() === 'empty') {
        <section class="state-panel">
          <p class="eyebrow">Sin solicitudes</p>
          <h2>Aún no has solicitado ninguna oferta FCT</h2>
          <p>Explora el catálogo de prácticas y solicita una oferta desde su detalle.</p>
          <a class="back-link" routerLink="/practicas">Ver ofertas publicadas</a>
        </section>
      } @else {
        <section
          class="solicitudes-results"
          aria-live="polite"
          aria-label="Solicitudes FCT enviadas"
        >
          <div class="results-heading">
            <p class="eyebrow">Solicitudes enviadas</p>
            <h2>{{ resultsTitle() }}</h2>
          </div>

          <div class="solicitudes-grid">
            @for (solicitud of solicitudes(); track solicitud.id) {
              <article class="solicitud-card">
                <div class="solicitud-card-heading">
                  <p class="solicitud-company">{{ solicitud.empresaNombre }}</p>
                  <h3>{{ solicitud.ofertaTitulo }}</h3>
                </div>

                <dl class="solicitud-details" aria-label="Datos de la solicitud">
                  <div>
                    <dt>Estado</dt>
                    <dd class="estado-cell">
                      <span class="estado-pill" [attr.data-estado]="solicitud.estado">
                        {{ estadoLabel(solicitud.estado) }}
                      </span>
                      @if (solicitud.asignadaPorCentro) {
                        <span class="estado-pill" data-estado="ASIGNADA">
                          Asignada por el centro
                        </span>
                      }
                    </dd>
                  </div>
                  <div>
                    <dt>Fecha de envío</dt>
                    <dd>{{ formatFecha(solicitud.createdAt) }}</dd>
                  </div>
                  @if (solicitud.fechaAsignacion; as fecha) {
                    <div>
                      <dt>Asignada el</dt>
                      <dd>{{ formatFecha(fecha) }}</dd>
                    </div>
                  }
                </dl>

                <a
                  class="solicitud-link"
                  [routerLink]="['/practicas', solicitud.ofertaId]"
                  [attr.aria-label]="'Ver detalle de ' + solicitud.ofertaTitulo"
                >
                  Ver oferta
                </a>
              </article>
            }
          </div>
        </section>
      }

      @if (showExternasSection()) {
        <section
          class="solicitudes-results externas-section"
          aria-live="polite"
          aria-label="Solicitudes externas Adzuna"
        >
          <div class="results-heading">
            <p class="eyebrow">Ofertas externas · Adzuna</p>
            <h2>Mis solicitudes externas</h2>
            <p class="externas-hint">
              Solicitudes que has marcado manualmente desde ofertas reales de Adzuna. Cuando una
              empresa te coja, marca aquí la solicitud como aceptada para que tu tutor pueda
              asignarla.
            </p>
          </div>

          @if (externasStatus() === 'loading') {
            <div class="state-panel">
              <p class="eyebrow">Cargando</p>
              <h2>Recuperando tus solicitudes externas</h2>
            </div>
          } @else if (externasStatus() === 'error') {
            <div class="state-panel alert" role="alert">
              <p class="eyebrow">Error</p>
              <h2>No se pudieron cargar las solicitudes externas</h2>
              <p>{{ externasErrorMessage() }}</p>
            </div>
          } @else if (solicitudesExternas().length === 0) {
            <div class="state-panel">
              <p class="eyebrow">Sin solicitudes externas</p>
              <h2>Aún no has marcado ninguna oferta de Adzuna</h2>
              <p>
                Desde el listado de prácticas pulsa "Marcar como solicitada" en cualquier oferta
                externa que hayas aplicado en Adzuna.
              </p>
            </div>
          } @else {
            <div class="solicitudes-grid solicitudes-grid-externas">
              @for (item of sortedSolicitudesExternas(); track item.id) {
                <div class="solicitud-externa-row" [class.is-retirada]="item.estado === 'RETIRADA'">
                  <article
                    class="solicitud-card solicitud-card-externa"
                    [class.is-aceptada]="item.estado === 'ACEPTADA'"
                    [class.is-retirada]="item.estado === 'RETIRADA'"
                  >
                    <div class="solicitud-card-heading">
                      <span class="origen-badge">Adzuna</span>
                      <p class="solicitud-company">
                        {{ item.empresaNombre || 'Empresa no especificada' }}
                      </p>
                      <h3>{{ item.titulo }}</h3>
                    </div>

                    <dl class="solicitud-details" aria-label="Datos de la solicitud externa">
                      @if (item.localidad) {
                        <div>
                          <dt>Localidad</dt>
                          <dd>{{ item.localidad }}{{ item.region ? ', ' + item.region : '' }}</dd>
                        </div>
                      }
                      <div>
                        <dt>Estado</dt>
                        <dd class="estado-cell">
                          <span class="estado-pill" [attr.data-estado]="item.estado">
                            {{ estadoExternaLabel(item.estado) }}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt>Última actualización</dt>
                        <dd>{{ formatFecha(item.updatedAt) }}</dd>
                      </div>
                    </dl>

                    <div class="externa-actions">
                      @if (item.estado === 'SOLICITADA') {
                        <button
                          type="button"
                          class="solicitud-link"
                          [disabled]="externalActionInFlight() === item.id"
                          (click)="markExternaAceptada(item)"
                        >
                          Aceptada
                        </button>
                      }
                      @if (item.estado === 'SOLICITADA' || item.estado === 'ACEPTADA') {
                        <button
                          type="button"
                          class="solicitud-link danger"
                          [disabled]="externalActionInFlight() === item.id"
                          (click)="anularExterna(item)"
                        >
                          {{ item.estado === 'ACEPTADA' ? 'Anular aceptación' : 'No seleccionado' }}
                        </button>
                      }
                      <a
                        class="solicitud-link secondary"
                        [href]="item.urlAplicacion"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver en Adzuna
                      </a>
                    </div>
                  </article>
                  @if (item.estado === 'RETIRADA') {
                    <button
                      type="button"
                      class="delete-solicitud"
                      [disabled]="externalActionInFlight() === item.id"
                      [attr.aria-label]="'Eliminar registro de ' + item.titulo"
                      (click)="deleteExterna(item)"
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.7 11H7.7L7 9Zm3 2 .3 7h1.4l-.2-7H10Zm3.5 0-.2 7h1.4l.3-7h-1.5Z" />
                      </svg>
                    </button>
                  }
                </div>
              }
            </div>
          }
        </section>
      }
    </main>
  `,
  styles: [
    `
      .mis-solicitudes-page {
        align-content: start;
        gap: 1rem;
        padding-top: 2rem;
      }

      .state-panel,
      .solicitudes-results {
        display: grid;
        gap: 1rem;
      }

      .state-panel {
        max-width: 46rem;
        padding: 1.2rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--surface);
        box-shadow: none;
      }

      .state-panel p:not(.eyebrow) {
        margin: 0.6rem 0 0;
        color: var(--muted);
        line-height: 1.6;
        font-size: 0.95rem;
      }

      .state-panel.alert {
        border-color: rgba(179, 38, 30, 0.32);
        background: var(--danger-soft);
      }

      .state-panel h2,
      .results-heading h2 {
        margin: 0;
        font-family: inherit;
        line-height: 1.2;
        font-size: 1.3rem;
        font-weight: 700;
        letter-spacing: -0.015em;
      }

      .results-heading {
        display: grid;
        gap: 0.3rem;
      }

      .solicitudes-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
        gap: 0.75rem;
      }

      .solicitudes-grid-externas {
        grid-template-columns: 1fr;
        overflow: visible;
      }

      .solicitud-externa-row {
        position: relative;
        min-width: 0;
      }

      .solicitud-card {
        display: grid;
        gap: 0.85rem;
        min-height: 100%;
        padding: 1.1rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--surface);
        box-shadow: none;
        transition: border-color 140ms ease;
      }

      .solicitud-card:hover {
        border-color: var(--line-strong);
      }

      .solicitud-card-heading {
        display: grid;
        gap: 0.45rem;
      }

      .solicitud-company {
        margin: 0;
        color: var(--muted-strong);
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .solicitud-card h3 {
        margin: 0;
        font-family: inherit;
        font-size: 1.02rem;
        line-height: 1.3;
        font-weight: 600;
        letter-spacing: -0.005em;
      }

      .solicitud-details {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0;
        margin: 0;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        overflow: hidden;
      }

      .solicitud-details div {
        min-width: 0;
        padding: 0.55rem 0.7rem;
        background: var(--surface-muted);
        border-right: 1px solid var(--line);
      }

      .solicitud-details div:nth-child(2n) {
        border-right: 0;
      }

      .solicitud-details div:nth-last-child(-n+2) {
        border-bottom: 0;
      }

      .solicitud-details dt {
        color: var(--muted);
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .solicitud-details dd {
        margin: 0.18rem 0 0;
        color: var(--ink);
        font-weight: 600;
        line-height: 1.3;
        font-size: 0.88rem;
      }

      .estado-pill {
        display: inline-flex;
        align-items: center;
        min-height: 1.5rem;
        padding: 0 0.55rem;
        border-radius: var(--radius-sm);
        background: var(--surface-muted);
        color: var(--ink);
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        border: 1px solid var(--line);
      }

      .estado-pill[data-estado='ACEPTADA'] {
        background: var(--success-soft);
        color: var(--success);
        border-color: rgba(29, 107, 74, 0.3);
      }

      .estado-pill[data-estado='RECHAZADA'] {
        background: var(--danger-soft);
        color: var(--danger);
        border-color: rgba(179, 38, 30, 0.3);
      }

      .estado-pill[data-estado='ASIGNADA'] {
        background: var(--accent-soft);
        color: var(--accent);
        border-color: rgba(17, 78, 74, 0.3);
      }

      .estado-cell {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.4rem;
        margin: 0.2rem 0 0;
      }

      .solicitud-link,
      .back-link {
        justify-self: start;
        min-height: 2.35rem;
        display: inline-flex;
        align-items: center;
        padding: 0 0.9rem;
        border-radius: var(--radius-md);
        font-weight: 600;
        font-size: 0.9rem;
        text-decoration: none;
        transition: background-color 140ms ease, border-color 140ms ease;
      }

      .solicitud-link {
        color: #ffffff;
        background: var(--accent);
        border: 1px solid var(--accent);
      }

      .solicitud-link:hover,
      .solicitud-link:focus-visible {
        background: var(--accent-hover);
        border-color: var(--accent-hover);
        outline: none;
      }

      .back-link {
        margin-top: 0.4rem;
        border: 1px solid var(--line-strong);
        color: var(--ink);
        background: var(--surface);
      }

      .back-link:hover,
      .back-link:focus-visible {
        border-color: var(--ink-soft);
        background: var(--surface-muted);
        outline: none;
      }

      .externas-section {
        margin-top: 1rem;
      }

      .externas-hint {
        margin: 0.35rem 0 0;
        color: var(--muted);
        font-size: 0.92rem;
        line-height: 1.55;
      }

      .solicitud-card-externa {
        grid-template-columns: minmax(16rem, 1.15fr) minmax(20rem, 1.35fr) auto;
        align-items: center;
        background: var(--surface);
        border-left: 3px solid var(--accent);
      }

      .solicitud-card-externa.is-aceptada {
        border-color: rgba(29, 107, 74, 0.34);
        border-left-color: var(--success);
        background: rgba(227, 246, 236, 0.8);
      }

      .solicitud-card-externa.is-retirada {
        border-color: rgba(179, 38, 30, 0.32);
        border-left-color: var(--danger);
        background: rgba(255, 246, 241, 0.96);
      }

      .solicitud-card-externa .solicitud-card-heading {
        min-width: 0;
      }

      .solicitud-card-externa .solicitud-details {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .solicitud-card-externa .solicitud-details div {
        border-right: 1px solid var(--line);
      }

      .solicitud-card-externa .solicitud-details div:last-child {
        border-right: 0;
      }

      .origen-badge {
        align-self: start;
        display: inline-flex;
        padding: 0.18rem 0.5rem;
        border-radius: var(--radius-sm);
        background: var(--surface-muted);
        color: var(--muted-strong);
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        border: 1px solid var(--line);
      }

      .externa-actions {
        margin-top: auto;
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }

      .solicitud-card-externa .externa-actions {
        justify-content: flex-end;
        margin-top: 0;
      }

      .delete-solicitud {
        width: 2.75rem;
        height: 2.75rem;
        position: absolute;
        top: 50%;
        right: -3.35rem;
        z-index: 1;
        transform: translateY(-50%);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(179, 38, 30, 0.34);
        border-radius: var(--radius-md);
        color: #8f3324;
        background: var(--danger-soft);
        cursor: pointer;
      }

      .delete-solicitud:hover,
      .delete-solicitud:focus-visible {
        border-color: rgba(179, 38, 30, 0.54);
        background: rgba(255, 226, 218, 0.95);
        outline: none;
      }

      .delete-solicitud:disabled {
        cursor: progress;
        opacity: 0.64;
      }

      .delete-solicitud svg {
        width: 1.1rem;
        height: 1.1rem;
        fill: currentColor;
      }

      .externa-actions .solicitud-link {
        justify-self: start;
      }

      .solicitud-link.secondary {
        border: 1px solid var(--line-strong);
        color: var(--ink);
        background: var(--surface);
      }

      .solicitud-link.secondary:hover,
      .solicitud-link.secondary:focus-visible {
        background: var(--surface-muted);
        border-color: var(--ink-soft);
        outline: none;
      }

      .solicitud-link.danger {
        border: 1px solid rgba(179, 38, 30, 0.34);
        color: #8f3324;
        background: var(--danger-soft);
      }

      .solicitud-link.danger:hover,
      .solicitud-link.danger:focus-visible {
        border-color: rgba(179, 38, 30, 0.54);
        background: rgba(255, 226, 218, 0.95);
        outline: none;
      }

      @media (max-width: 620px) {
        .mis-solicitudes-page {
          padding-top: 1rem;
        }

        .solicitud-card-externa {
          grid-template-columns: 1fr;
        }

        .solicitud-card-externa .externa-actions {
          justify-content: flex-start;
        }

        .delete-solicitud {
          top: 0.75rem;
          right: -3.1rem;
          transform: none;
        }

        .solicitud-details {
          grid-template-columns: 1fr;
        }

        .solicitud-card-externa .solicitud-details {
          grid-template-columns: 1fr;
        }

        .solicitud-card-externa .solicitud-details div,
        .solicitud-card-externa .solicitud-details div:last-child {
          border-right: 0;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MisSolicitudesPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly solicitudesService = inject(SolicitudesService);
  private readonly solicitudesExternasService = inject(SolicitudesExternasService);
  private readonly practicasCache = inject(PracticasCacheService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly status = signal<ListStatus>('loading');
  protected readonly solicitudes = signal<SolicitudFct[]>([]);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly externasStatus = signal<ListStatus>('loading');
  protected readonly solicitudesExternas = signal<SolicitudExterna[]>([]);
  protected readonly externasErrorMessage = signal<string | null>(null);
  protected readonly externalActionInFlight = signal<number | null>(null);
  protected readonly sortedSolicitudesExternas = computed(() =>
    this.solicitudesExternas().slice().sort(compareSolicitudesExternas),
  );

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.status.set('not-authenticated');
      return;
    }

    if (!this.authService.accessToken()) {
      this.status.set('not-authenticated');
      return;
    }

    this.status.set('loading');
    this.errorMessage.set(null);
    this.externasStatus.set('loading');
    this.externasErrorMessage.set(null);

    this.solicitudesService
      .mine()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (solicitudes) => {
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
    this.loadExternas();
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
    return count === 1 ? '1 solicitud enviada' : `${count} solicitudes enviadas`;
  }

  protected showExternasSection(): boolean {
    if (this.status() === 'not-authenticated' || this.status() === 'error') {
      return false;
    }
    return this.externasStatus() === 'loading'
      || this.externasStatus() === 'error'
      || this.solicitudesExternas().length > 0;
  }

  protected estadoExternaLabel(estado: SolicitudExternaEstado): string {
    return ESTADO_EXTERNA_LABELS[estado] ?? estado;
  }

  protected markExternaAceptada(solicitud: SolicitudExterna): void {
    if (this.externalActionInFlight() === solicitud.id || !this.confirmAceptada()) {
      return;
    }
    this.runExternalAction(
      solicitud,
      this.solicitudesExternasService.changeEstado(solicitud.id, 'ACEPTADA'),
    );
  }

  protected anularExterna(solicitud: SolicitudExterna): void {
    if (this.externalActionInFlight() === solicitud.id) {
      return;
    }
    if (!this.confirmAnular(solicitud.estado)) {
      return;
    }
    this.runExternalAction(
      solicitud,
      this.solicitudesExternasService.changeEstado(solicitud.id, 'RETIRADA'),
    );
  }

  protected deleteExterna(solicitud: SolicitudExterna): void {
    if (this.externalActionInFlight() === solicitud.id || solicitud.estado !== 'RETIRADA') {
      return;
    }
    if (!this.confirmDelete()) {
      return;
    }
    this.runExternalDelete(solicitud);
  }

  private confirmAnular(estado: SolicitudExternaEstado): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    const detalle = estado === 'ACEPTADA'
      ? 'Esta solicitud está marcada como aceptada. Si la anulas, deberás volver a marcarla desde el listado de prácticas si la empresa te confirma de nuevo.'
      : 'Usa esta opción cuando la empresa te comunique que no has sido seleccionado. La solicitud desaparecerá de esta lista.';
    const title = estado === 'ACEPTADA' ? '¿Anular la aceptación?' : '¿Marcar como no seleccionado?';
    return window.confirm(`${title} ${detalle}`);
  }

  private loadExternas(): void {
    this.solicitudesExternasService
      .mine()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (solicitudes) => {
          this.solicitudesExternas.set(solicitudes);
          this.practicasCache.setMineExternas(solicitudes);
          this.externasStatus.set(solicitudes.length === 0 ? 'empty' : 'loaded');
        },
        error: (error: unknown) => {
          this.solicitudesExternas.set([]);
          this.externasErrorMessage.set(listErrorMessage(error));
          this.externasStatus.set('error');
        },
      });
  }

  private runExternalAction(
    solicitud: SolicitudExterna,
    request$: Observable<SolicitudExterna>,
  ): void {
    this.externalActionInFlight.set(solicitud.id);
    this.externasErrorMessage.set(null);
    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          let nextSolicitudes: SolicitudExterna[] = [];
          this.solicitudesExternas.update((current) => {
            nextSolicitudes = current.map((item) => (item.id === updated.id ? updated : item));
            return nextSolicitudes;
          });
          this.practicasCache.setMineExternas(nextSolicitudes);
          if (this.solicitudesExternas().length === 0) {
            this.externasStatus.set('empty');
          }
          this.externalActionInFlight.set(null);
        },
        error: (error: unknown) => {
          this.externasErrorMessage.set(listErrorMessage(error));
          this.externasStatus.set('error');
          this.externalActionInFlight.set(null);
        },
      });
  }

  private runExternalDelete(solicitud: SolicitudExterna): void {
    this.externalActionInFlight.set(solicitud.id);
    this.externasErrorMessage.set(null);
    this.solicitudesExternasService
      .delete(solicitud.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const nextSolicitudes = this.solicitudesExternas().filter((item) => item.id !== solicitud.id);
          this.solicitudesExternas.set(nextSolicitudes);
          this.practicasCache.setMineExternas(nextSolicitudes);
          if (nextSolicitudes.length === 0) {
            this.externasStatus.set('empty');
          }
          this.externalActionInFlight.set(null);
        },
        error: (error: unknown) => {
          this.externasErrorMessage.set(listErrorMessage(error));
          this.externasStatus.set('error');
          this.externalActionInFlight.set(null);
        },
      });
  }

  private confirmAceptada(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    return window.confirm(
      'Confirma solo si la empresa externa te ha aceptado. Tu tutor podra crear la asignacion FCT desde esta solicitud.',
    );
  }

  private confirmDelete(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    return window.confirm('¿Eliminar este registro? Esta acción quitará la solicitud retirada de tu historial.');
  }
}

function compareSolicitudesExternas(a: SolicitudExterna, b: SolicitudExterna): number {
  const stateDiff = estadoSortWeight(a.estado) - estadoSortWeight(b.estado);
  if (stateDiff !== 0) {
    return stateDiff;
  }
  return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
}

function estadoSortWeight(estado: SolicitudExternaEstado): number {
  switch (estado) {
    case 'ACEPTADA': return 0;
    case 'SOLICITADA': return 1;
    case 'RECHAZADA': return 2;
    case 'RETIRADA': return 3;
  }
}

const ESTADO_LABELS: Record<SolicitudEstado, string> = {
  SOLICITADA: 'Solicitada',
  ACEPTADA: 'Aceptada',
  RECHAZADA: 'Rechazada',
};

const ESTADO_EXTERNA_LABELS: Record<SolicitudExternaEstado, string> = {
  SOLICITADA: 'Solicitada',
  ACEPTADA: 'Aceptada',
  RECHAZADA: 'Rechazada',
  RETIRADA: 'No seleccionado',
};

function isUnauthorized(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 401;
}

function listErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 0) {
    return 'No se pudo contactar con el servidor. Comprueba que el backend esté disponible.';
  }

  return 'No se pudo completar la consulta. Inténtalo de nuevo.';
}
