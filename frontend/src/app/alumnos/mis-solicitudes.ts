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
import { AuthService } from '../auth/auth.service';
import { SolicitudEstado, SolicitudFct } from '../practicas/solicitudes.models';
import { SolicitudesService } from '../practicas/solicitudes.service';

type ListStatus = 'loading' | 'loaded' | 'empty' | 'error' | 'not-authenticated';

@Component({
  selector: 'app-mis-solicitudes-page',
  imports: [RouterLink],
  template: `
    <main class="page-shell route-page mis-solicitudes-page">
      <header class="route-hero">
        <p class="eyebrow">Alumno</p>
        <h1>Mis solicitudes</h1>
        <p>
          Consulta las ofertas FCT a las que te has presentado, su estado actual y la fecha de
          envío.
        </p>
      </header>

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
                    <dd>
                      <span class="estado-pill" [attr.data-estado]="solicitud.estado">
                        {{ estadoLabel(solicitud.estado) }}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>Fecha de envío</dt>
                    <dd>{{ formatFecha(solicitud.createdAt) }}</dd>
                  </div>
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
        border-radius: 0.5rem;
        background: var(--surface);
        box-shadow: var(--shadow-soft);
        backdrop-filter: blur(14px);
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

      .state-panel h2,
      .results-heading h2 {
        margin: 0;
        font-family: inherit;
        line-height: 1.2;
        font-size: 1.45rem;
      }

      .results-heading {
        display: grid;
        gap: 0.35rem;
      }

      .solicitudes-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
        gap: 1rem;
      }

      .solicitud-card {
        display: grid;
        gap: 1rem;
        min-height: 100%;
        padding: 1rem;
        border: 1px solid var(--line);
        border-radius: 0.5rem;
        background: rgba(255, 251, 245, 0.72);
        box-shadow: var(--shadow-soft);
      }

      .solicitud-card-heading {
        display: grid;
        gap: 0.55rem;
      }

      .solicitud-company {
        margin: 0;
        color: var(--accent);
        font-size: 0.82rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .solicitud-card h3 {
        margin: 0;
        font-family: inherit;
        font-size: 1.15rem;
        line-height: 1.25;
      }

      .solicitud-details {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.65rem;
        margin: 0;
      }

      .solicitud-details div {
        min-width: 0;
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

      .estado-pill {
        display: inline-flex;
        align-items: center;
        min-height: 1.85rem;
        padding: 0 0.7rem;
        border-radius: 999px;
        background: rgba(15, 118, 110, 0.14);
        color: var(--ink);
        font-size: 0.85rem;
        font-weight: 800;
      }

      .estado-pill[data-estado='ACEPTADA'] {
        background: rgba(46, 125, 50, 0.18);
        color: #1b5e20;
      }

      .estado-pill[data-estado='RECHAZADA'] {
        background: rgba(184, 79, 59, 0.18);
        color: #7a2c1c;
      }

      .solicitud-link,
      .back-link {
        justify-self: start;
        min-height: 2.5rem;
        display: inline-flex;
        align-items: center;
        padding: 0 0.85rem;
        border-radius: 0.5rem;
        font-weight: 800;
        text-decoration: none;
      }

      .solicitud-link {
        color: #f7fbf8;
        background: var(--accent);
      }

      .solicitud-link:hover,
      .solicitud-link:focus-visible {
        background: #0b5f59;
        outline: none;
      }

      .back-link {
        margin-top: 0.4rem;
        border: 1px solid var(--line);
        color: var(--ink);
        background: rgba(255, 255, 255, 0.62);
      }

      .back-link:hover,
      .back-link:focus-visible {
        border-color: rgba(15, 118, 110, 0.36);
        outline: none;
      }

      @media (max-width: 620px) {
        .mis-solicitudes-page {
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
export class MisSolicitudesPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly solicitudesService = inject(SolicitudesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly status = signal<ListStatus>('loading');
  protected readonly solicitudes = signal<SolicitudFct[]>([]);
  protected readonly errorMessage = signal<string | null>(null);

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
  if (error instanceof HttpErrorResponse && error.status === 0) {
    return 'No se pudo contactar con el servidor. Comprueba que el backend esté disponible.';
  }

  return 'No se pudo completar la consulta. Inténtalo de nuevo.';
}
