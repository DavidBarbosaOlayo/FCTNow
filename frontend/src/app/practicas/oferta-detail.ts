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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { OfertaFct, OfertaModalidad } from './ofertas.models';
import { OfertasService } from './ofertas.service';
import { SolicitudesService } from './solicitudes.service';

type DetailStatus = 'loading' | 'loaded' | 'error' | 'not-found';
type ApplicationStatus = 'idle' | 'checking' | 'requested' | 'submitting' | 'error';

type ModalidadOption = {
  value: OfertaModalidad;
  label: string;
};

@Component({
  selector: 'app-oferta-detail-page',
  imports: [RouterLink],
  template: `
    <main class="page-shell route-page oferta-detail-page">
      <a class="back-link" routerLink="/practicas">Volver al catálogo</a>

      @if (status() === 'loading') {
        <section class="state-panel" aria-live="polite">
          <p class="eyebrow">Cargando</p>
          <h1>Consultando la oferta FCT</h1>
          <p>Estamos recuperando la información publicada por la empresa.</p>
        </section>
      } @else if (status() === 'error') {
        <section class="state-panel alert" role="alert">
          <p class="eyebrow">Error</p>
          <h1>No se pudo cargar la oferta</h1>
          <p>{{ errorMessage() }}</p>
        </section>
      } @else if (status() === 'not-found') {
        <section class="state-panel">
          <p class="eyebrow">No disponible</p>
          <h1>Oferta no encontrada</h1>
          <p>La oferta no existe, no está publicada o ya no está disponible.</p>
        </section>
      } @else if (oferta(); as oferta) {
        <header class="detail-hero">
          <p class="eyebrow">Oferta FCT publicada</p>
          <h1>{{ oferta.titulo }}</h1>
          <p>{{ oferta.descripcion }}</p>
          <div class="hero-meta" aria-label="Resumen de la oferta">
            <span>{{ oferta.empresaNombre }}</span>
            <span>{{ oferta.localidad }}, {{ oferta.provincia }}</span>
            <span>{{ modalidadLabel(oferta.modalidad) }}</span>
          </div>
        </header>

        <div class="detail-layout">
          <section class="detail-panel" aria-labelledby="oferta-datos">
            <h2 id="oferta-datos">Datos principales</h2>
            <dl class="detail-list">
              <div>
                <dt>Empresa</dt>
                <dd>{{ oferta.empresaNombre }}</dd>
              </div>
              <div>
                <dt>Familia profesional</dt>
                <dd>{{ oferta.familiaProfesional }}</dd>
              </div>
              @if (oferta.cicloFormativo) {
                <div>
                  <dt>Ciclo formativo</dt>
                  <dd>{{ oferta.cicloFormativo }}</dd>
                </div>
              }
              <div>
                <dt>Localidad</dt>
                <dd>{{ oferta.localidad }}, {{ oferta.provincia }}</dd>
              </div>
              <div>
                <dt>Modalidad</dt>
                <dd>{{ modalidadLabel(oferta.modalidad) }}</dd>
              </div>
              <div>
                <dt>Fecha inicio</dt>
                <dd>{{ oferta.fechaInicio }}</dd>
              </div>
              <div>
                <dt>Fecha fin</dt>
                <dd>{{ oferta.fechaFin }}</dd>
              </div>
              <div>
                <dt>Plazas</dt>
                <dd>{{ oferta.plazas }}</dd>
              </div>
            </dl>
          </section>

          <section class="detail-panel" aria-labelledby="oferta-contenido">
            <h2 id="oferta-contenido">Contenido de la práctica</h2>
            <div class="copy-block">
              <h3>Tareas</h3>
              <p>{{ oferta.tareas }}</p>
            </div>
            @if (oferta.requisitos) {
              <div class="copy-block">
                <h3>Requisitos</h3>
                <p>{{ oferta.requisitos }}</p>
              </div>
            }
          </section>

          <section class="detail-panel application-panel" aria-labelledby="oferta-solicitud">
            <h2 id="oferta-solicitud">Solicitud</h2>

            @if (!isAuthenticated()) {
              <p>Inicia sesion con tu cuenta de alumno para solicitar esta oferta FCT.</p>
              <a class="primary-action" routerLink="/login">Iniciar sesion</a>
            } @else if (applicationStatus() === 'checking') {
              <p aria-live="polite">Comprobando si ya has solicitado esta oferta.</p>
            } @else if (applicationStatus() === 'requested') {
              <p class="success-copy" aria-live="polite">
                Ya has solicitado esta oferta. Puedes seguir consultando el detalle mientras el
                centro revisa las solicitudes.
              </p>
            } @else {
              <p>
                Solicita esta oferta si encaja con tus preferencias de FCT. El centro podra
                revisar tu interes en fases posteriores.
              </p>
              <button
                type="button"
                class="primary-action"
                [disabled]="applicationStatus() === 'submitting'"
                (click)="requestOffer(oferta.id)"
              >
                @if (applicationStatus() === 'submitting') {
                  Enviando solicitud
                } @else {
                  Solicitar oferta
                }
              </button>

              @if (applicationStatus() === 'error') {
                <p class="error-copy" role="alert">{{ applicationMessage() }}</p>
              }
            }
          </section>
        </div>
      }
    </main>
  `,
  styles: [
    `
      .oferta-detail-page {
        align-content: start;
        gap: 1rem;
        padding-top: 2rem;
      }

      .back-link {
        justify-self: start;
        min-height: 2.4rem;
        display: inline-flex;
        align-items: center;
        padding: 0 0.8rem;
        border: 1px solid var(--line);
        border-radius: 0.5rem;
        color: var(--ink);
        background: rgba(255, 255, 255, 0.62);
        font-weight: 800;
        text-decoration: none;
      }

      .back-link:hover,
      .back-link:focus-visible,
      .primary-action:hover,
      .primary-action:focus-visible {
        border-color: rgba(15, 118, 110, 0.36);
        outline: none;
      }

      .detail-hero,
      .state-panel,
      .detail-panel {
        border: 1px solid var(--line);
        border-radius: 0.5rem;
        box-shadow: var(--shadow-soft);
        backdrop-filter: blur(14px);
      }

      .detail-hero {
        display: grid;
        gap: 0.8rem;
        max-width: 72rem;
        padding: 1.35rem;
        background: rgba(255, 251, 245, 0.74);
      }

      .detail-hero h1,
      .state-panel h1,
      .detail-panel h2,
      .copy-block h3 {
        margin: 0;
        font-family: inherit;
        line-height: 1.2;
      }

      .detail-hero h1,
      .state-panel h1 {
        max-width: 22ch;
        font-size: 3rem;
      }

      .detail-hero p:not(.eyebrow),
      .state-panel p:not(.eyebrow),
      .copy-block p {
        margin: 0;
        color: var(--muted);
        line-height: 1.65;
      }

      .hero-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.55rem;
      }

      .hero-meta span {
        min-height: 2rem;
        display: inline-flex;
        align-items: center;
        padding: 0 0.65rem;
        border: 1px solid var(--line);
        border-radius: 999px;
        color: var(--ink);
        background: rgba(255, 255, 255, 0.58);
        font-size: 0.88rem;
        font-weight: 800;
      }

      .detail-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(18rem, 0.9fr);
        gap: 1rem;
      }

      .detail-panel,
      .state-panel {
        background: var(--surface);
      }

      .detail-panel {
        display: grid;
        align-content: start;
        gap: 1rem;
        padding: 1.1rem;
      }

      .detail-panel h2 {
        font-size: 1.35rem;
      }

      .detail-list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.85rem;
        margin: 0;
      }

      .detail-list div {
        min-width: 0;
        padding: 0.75rem;
        border: 1px solid var(--line);
        border-radius: 0.5rem;
        background: rgba(255, 255, 255, 0.5);
      }

      .detail-list dt {
        color: var(--muted);
        font-size: 0.78rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .detail-list dd {
        margin: 0.2rem 0 0;
        color: var(--ink);
        font-weight: 800;
        line-height: 1.35;
      }

      .copy-block {
        display: grid;
        gap: 0.45rem;
        padding-top: 1rem;
        border-top: 1px solid var(--line);
      }

      .copy-block:first-of-type {
        padding-top: 0;
        border-top: 0;
      }

      .copy-block h3 {
        font-size: 1rem;
      }

      .application-panel {
        grid-column: 1 / -1;
      }

      .application-panel p {
        margin: 0;
        color: var(--muted);
        line-height: 1.55;
      }

      .primary-action {
        justify-self: start;
        min-height: 2.55rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 1rem;
        border: 1px solid rgba(15, 118, 110, 0.28);
        border-radius: 0.5rem;
        color: #ffffff;
        background: #0f766e;
        font: inherit;
        font-weight: 800;
        text-decoration: none;
        cursor: pointer;
      }

      .primary-action:disabled {
        cursor: progress;
        opacity: 0.72;
      }

      .success-copy {
        color: #0f766e;
        font-weight: 800;
      }

      .error-copy {
        color: #b84f3b;
        font-weight: 800;
      }

      .state-panel {
        max-width: 44rem;
        padding: 1.2rem;
      }

      .state-panel p:not(.eyebrow) {
        margin-top: 0.7rem;
      }

      .state-panel.alert {
        border-color: rgba(184, 79, 59, 0.28);
        background: rgba(255, 246, 241, 0.9);
      }

      @media (max-width: 820px) {
        .detail-layout,
        .detail-list {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 620px) {
        .oferta-detail-page {
          padding-top: 1rem;
        }

        .detail-hero h1,
        .state-panel h1 {
          font-size: 2rem;
        }

        .hero-meta {
          display: grid;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfertaDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ofertasService = inject(OfertasService);
  private readonly solicitudesService = inject(SolicitudesService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly status = signal<DetailStatus>('loading');
  protected readonly oferta = signal<OfertaFct | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly applicationStatus = signal<ApplicationStatus>('idle');
  protected readonly applicationMessage = signal<string | null>(null);
  protected readonly isAuthenticated = this.authService.isAuthenticated;

  private readonly modalidadOptions: ModalidadOption[] = [
    { value: 'PRESENCIAL', label: 'Presencial' },
    { value: 'HIBRIDA', label: 'Híbrida' },
    { value: 'REMOTA', label: 'Remota' },
  ];

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const offerId = parseOfferId(params.get('id'));

      this.oferta.set(null);
      this.errorMessage.set(null);
      this.applicationStatus.set('idle');
      this.applicationMessage.set(null);

      if (offerId === null) {
        this.status.set('not-found');
        return;
      }

      if (!isPlatformBrowser(this.platformId)) {
        this.status.set('loading');
        return;
      }

      this.loadOffer(offerId);
    });
  }

  protected modalidadLabel(modalidad: OfertaModalidad): string {
    return this.modalidadOptions.find((option) => option.value === modalidad)?.label ?? modalidad;
  }

  private loadOffer(offerId: number): void {
    this.status.set('loading');

    this.ofertasService
      .detail(offerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (oferta) => {
          this.oferta.set(oferta);
          this.status.set('loaded');
          this.loadApplicationState(oferta.id);
        },
        error: (error: unknown) => {
          this.oferta.set(null);

          if (isNotFound(error)) {
            this.status.set('not-found');
            return;
          }

          this.errorMessage.set(detailErrorMessage(error));
          this.status.set('error');
        },
      });
  }

  protected requestOffer(offerId: number): void {
    if (!this.isAuthenticated() || this.applicationStatus() === 'submitting') {
      return;
    }

    this.applicationStatus.set('submitting');
    this.applicationMessage.set(null);

    this.solicitudesService
      .requestOffer(offerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.applicationStatus.set('requested');
        },
        error: (error: unknown) => {
          if (isConflict(error)) {
            this.applicationStatus.set('requested');
            return;
          }

          this.applicationMessage.set(applicationErrorMessage(error));
          this.applicationStatus.set('error');
        },
      });
  }

  private loadApplicationState(offerId: number): void {
    if (!this.isAuthenticated()) {
      this.applicationStatus.set('idle');
      return;
    }

    this.applicationStatus.set('checking');

    this.solicitudesService
      .mine()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (solicitudes) => {
          this.applicationStatus.set(
            solicitudes.some((solicitud) => solicitud.ofertaId === offerId) ? 'requested' : 'idle',
          );
        },
        error: (error: unknown) => {
          this.applicationMessage.set(applicationErrorMessage(error));
          this.applicationStatus.set('error');
        },
      });
  }
}

function parseOfferId(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function isNotFound(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 404;
}

function isConflict(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 409;
}

function detailErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 401) {
      return 'Inicia sesión para consultar el detalle de la oferta FCT.';
    }

    if (error.status === 0) {
      return 'No se pudo contactar con el backend. Comprueba que el servidor esté disponible.';
    }
  }

  return 'Inténtalo de nuevo desde el catálogo de prácticas.';
}

function applicationErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 401) {
      return 'Inicia sesion para solicitar esta oferta FCT.';
    }

    if (error.status === 403) {
      return 'Solo los alumnos pueden solicitar ofertas FCT.';
    }

    if (error.status === 404) {
      return 'La oferta no existe, no esta publicada o ya no esta disponible.';
    }

    if (error.status === 0) {
      return 'No se pudo contactar con el backend. Comprueba que el servidor este disponible.';
    }
  }

  return 'No se pudo enviar la solicitud. Intentalo de nuevo.';
}
