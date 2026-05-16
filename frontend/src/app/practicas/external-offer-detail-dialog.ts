import { Component, EventEmitter, HostListener, Input, Output, signal } from '@angular/core';
import { TutorAlumno } from '../fct/tutor-alumnos.models';
import { OfertaExterna } from './ofertas-externas.models';
import {
  SolicitudExterna,
  SolicitudExternaEstado,
} from './solicitudes-externas.models';

@Component({
  selector: 'app-external-offer-detail-dialog',
  template: `
    <div class="backdrop" role="presentation" (click)="closed.emit()">
      <section
        class="dialog"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="'external-detail-title-' + offer.id"
        (click)="$event.stopPropagation()"
      >
        <div class="heading">
          <div>
            <p class="eyebrow">Oferta externa · Adzuna</p>
            <div class="title-row">
              <h2 [id]="'external-detail-title-' + offer.id">{{ offer.titulo }}</h2>
              @if (offer.publicadoEn) {
                <span class="published-badge" aria-label="Fecha de publicación">
                  Publicada {{ publishedLabel() }}
                </span>
              }
            </div>
            <p>{{ offer.empresaNombre || 'Empresa no especificada' }}</p>
          </div>
          <button
            type="button"
            class="detail-close-action"
            aria-label="Cerrar detalle"
            (click)="closed.emit()"
          >
            ×
          </button>
        </div>

        <dl class="detail-grid" aria-label="Datos completos de la oferta externa">
          <div>
            <dt>Fuente</dt>
            <dd>Adzuna</dd>
          </div>
          <div>
            <dt>Identificador externo</dt>
            <dd>{{ offer.id }}</dd>
          </div>
          <div>
            <dt>Empresa</dt>
            <dd>{{ offer.empresaNombre || 'Empresa no especificada' }}</dd>
          </div>
          <div>
            <dt>Localidad</dt>
            <dd>{{ offer.localidad || 'No especificada' }}</dd>
          </div>
          <div>
            <dt>Región</dt>
            <dd>{{ offer.region || 'No especificada' }}</dd>
          </div>
          <div>
            <dt>Categoría</dt>
            <dd>{{ offer.categoria || 'No especificada' }}</dd>
          </div>
          <div>
            <dt>Contrato</dt>
            <dd>{{ offer.contratoTipo || 'No especificado' }}</dd>
          </div>
          <div>
            <dt>Jornada</dt>
            <dd>{{ offer.jornada || 'No especificada' }}</dd>
          </div>
          <div>
            <dt>Salario</dt>
            <dd>{{ salaryLabel() }}</dd>
          </div>
        </dl>

        @if (offer.descripcion) {
          <div class="description">
            <h3>Descripción</h3>
            <div class="description-body">
              <p>{{ offer.descripcion }}</p>
            </div>
            @if (isAdzunaTruncated) {
              <p class="description-source">
                Adzuna sólo entrega un resumen de la oferta (máx. 500 caracteres).
                <a [href]="offer.urlAplicacion" target="_blank" rel="noopener noreferrer">
                  Lee la descripción completa en Adzuna
                </a>.
              </p>
            }
          </div>
        }

        <div class="actions">
          <a class="action-link" [href]="offer.urlAplicacion" target="_blank" rel="noopener noreferrer">
            Ver oferta en Adzuna
          </a>
          @if (isCentro) {
            <div class="recommend-wrap">
              <button
                type="button"
                class="action-link secondary recommend-toggle"
                (click)="toggleRecommend()"
                [attr.aria-expanded]="recommendOpen()"
              >
                Recomendar
              </button>
              @if (recommendOpen()) {
                <div
                  class="recommend-panel external-detail-recommend-panel"
                  role="dialog"
                  aria-label="Recomendar oferta externa"
                >
                  @if (matches.length === 0) {
                    <p class="recommend-empty">Ningún alumno encaja por familia profesional.</p>
                  } @else {
                    <p class="recommend-heading">Alumnos compatibles</p>
                    <ul class="recommend-list">
                      @for (alumno of matches; track alumno.id) {
                        <li>
                          <button
                            type="button"
                            class="recommend-student"
                            [disabled]="isRecommendationInFlight(alumno) || hasRecommendationSent(alumno)"
                            (click)="recommend.emit(alumno)"
                          >
                            <strong>{{ alumno.displayName }}</strong>
                            @if (alumno.preferencias?.cicloFormativo) {
                              <span> · {{ alumno.preferencias?.cicloFormativo }}</span>
                            }
                            @if (alumno.preferencias?.localidad) {
                              <span> · {{ alumno.preferencias?.localidad }}</span>
                            }
                            @if (hasRecommendationSent(alumno)) {
                              <span> · Recomendada</span>
                            }
                          </button>
                        </li>
                      }
                    </ul>
                    @if (recommendationMessage) {
                      <p class="recommend-feedback success-copy">{{ recommendationMessage }}</p>
                    }
                    @if (recommendationError) {
                      <p class="recommend-feedback error-copy" role="alert">{{ recommendationError }}</p>
                    }
                  }
                </div>
              }
            </div>
          } @else if (canAnular()) {
            <button
              type="button"
              class="action-link tracking"
              [class.is-aceptada]="solicitud?.estado === 'ACEPTADA'"
              [disabled]="actionInFlight"
              (click)="anular.emit()"
            >
              <span class="state">{{ estadoLabel(solicitud!.estado) }} · {{ anularActionLabel(solicitud!.estado) }}</span>
            </button>
          } @else {
            <button
              type="button"
              class="action-link tracking idle"
              [disabled]="actionInFlight"
              (click)="solicit.emit()"
            >
              Marcar como solicitada
            </button>
          }
          <button type="button" class="action-link secondary" (click)="closed.emit()">Cerrar</button>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .backdrop {
        position: fixed;
        inset: 0;
        z-index: 20;
        display: grid;
        place-items: center;
        padding: 1rem;
        background: rgba(10, 15, 20, 0.46);
      }

      .dialog {
        width: min(100%, 54rem);
        max-height: min(86vh, 52rem);
        overflow: auto;
        display: grid;
        gap: 1rem;
        padding: 1.25rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--surface);
        box-shadow: var(--shadow-deep);
      }

      .heading {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 1rem;
        align-items: start;
      }

      .heading h2,
      .description h3 {
        margin: 0;
        font-family: inherit;
        line-height: 1.2;
      }

      .heading h2 {
        font-size: 1.35rem;
        font-weight: 700;
        letter-spacing: -0.015em;
      }

      .title-row {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 0.5rem 0.7rem;
        margin: 0.25rem 0 0;
      }

      .published-badge {
        display: inline-flex;
        align-items: center;
        padding: 0.2rem 0.55rem;
        border-radius: var(--radius-sm);
        background: var(--accent-soft);
        color: var(--accent);
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        border: 1px solid rgba(17, 78, 74, 0.18);
      }

      .heading p:not(.eyebrow),
      .description p {
        margin: 0.4rem 0 0;
        color: var(--muted);
        line-height: 1.55;
        font-size: 0.93rem;
      }

      .detail-close-action {
        width: 2rem;
        height: 2rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        color: var(--ink);
        background: var(--surface);
        font: inherit;
        font-size: 1.25rem;
        line-height: 1;
        cursor: pointer;
      }

      .detail-close-action:hover,
      .detail-close-action:focus-visible {
        border-color: var(--ink-soft);
        background: var(--surface-muted);
        outline: none;
      }

      .detail-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0;
        margin: 0;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        overflow: hidden;
      }

      .detail-grid div {
        padding: 0.7rem 0.85rem;
        background: var(--surface-muted);
        border-right: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
      }

      .detail-grid div:nth-child(3n) {
        border-right: 0;
      }

      .detail-grid div:nth-last-child(-n+3) {
        border-bottom: 0;
      }

      .detail-grid dt {
        color: var(--muted);
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .detail-grid dd {
        margin: 0.22rem 0 0;
        color: var(--ink);
        font-weight: 600;
        line-height: 1.35;
        overflow-wrap: anywhere;
        font-size: 0.9rem;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: flex-start;
      }

      .action-link {
        min-height: 2.4rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 1rem;
        border: 1px solid var(--accent);
        border-radius: var(--radius-md);
        color: #ffffff;
        background: var(--accent);
        font: inherit;
        font-weight: 600;
        font-size: 0.9rem;
        text-decoration: none;
        cursor: pointer;
      }

      .action-link:hover:not(:disabled),
      .action-link:focus-visible:not(:disabled) {
        background: var(--accent-hover);
        border-color: var(--accent-hover);
        outline: none;
      }

      .action-link.secondary {
        border: 1px solid var(--line-strong);
        color: var(--ink);
        background: var(--surface);
      }

      .action-link.secondary:hover:not(:disabled),
      .action-link.secondary:focus-visible:not(:disabled) {
        background: var(--surface-muted);
        border-color: var(--ink-soft);
      }

      .action-link.tracking {
        border: 1px solid rgba(17, 78, 74, 0.35);
        color: var(--accent);
        background: var(--accent-soft);
        font-weight: 600;
      }

      .action-link.tracking.idle {
        border-color: var(--accent);
        background: var(--accent);
        color: #ffffff;
      }

      .action-link.tracking.is-aceptada {
        border-color: var(--accent);
        background: var(--accent-soft);
        color: var(--accent);
      }

      .action-link.tracking:hover:not(:disabled),
      .action-link.tracking:focus-visible:not(:disabled) {
        outline: none;
      }

      .action-link.tracking:not(.idle):hover:not(:disabled),
      .action-link.tracking:not(.idle):focus-visible:not(:disabled) {
        border-color: var(--danger);
        background: var(--danger-soft);
        color: var(--danger);
      }

      .action-link.tracking:disabled {
        cursor: progress;
        opacity: 0.65;
      }

      .external-detail-recommend-panel {
        left: 0;
        right: auto;
      }

      .description {
        display: flex;
        flex-direction: column;
      }

      .description-body {
        margin-top: 0.4rem;
        padding-left: 0.85rem;
        border-left: 2px solid var(--accent);
        max-height: 22rem;
        overflow-y: auto;
        padding-right: 0.6rem;
      }

      .description-body p {
        margin: 0;
        white-space: pre-line;
        color: var(--ink);
        line-height: 1.6;
        font-size: 0.93rem;
      }

      .description-source {
        margin: 0.6rem 0 0;
        padding: 0.6rem 0.75rem;
        border-radius: var(--radius-md);
        background: var(--surface-muted);
        border: 1px solid var(--line);
        color: var(--ink);
        font-size: 0.85rem;
        line-height: 1.5;
      }

      .description-source a {
        color: var(--accent);
        font-weight: 600;
        text-decoration: underline;
        text-underline-offset: 0.2rem;
      }

      .description-source a:hover,
      .description-source a:focus-visible {
        color: var(--accent-hover);
        outline: none;
      }

      @media (max-width: 860px) {
        .detail-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 620px) {
        .detail-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ExternalOfferDetailDialog {
  @Input({ required: true }) offer!: OfertaExterna;
  @Input() solicitud: SolicitudExterna | null = null;
  @Input() actionInFlight = false;
  @Input() isCentro = false;
  @Input() matches: TutorAlumno[] = [];
  @Input() recommendationInFlight: string | null = null;
  @Input() recommendationMessage: string | null = null;
  @Input() recommendationError: string | null = null;
  @Input() sentRecommendationKeys: ReadonlySet<string> = new Set();
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly solicit = new EventEmitter<void>();
  @Output() readonly anular = new EventEmitter<void>();
  @Output() readonly recommend = new EventEmitter<TutorAlumno>();

  protected readonly recommendOpen = signal(false);

  protected get isAdzunaTruncated(): boolean {
    const desc = this.offer.descripcion ?? '';
    return desc.endsWith('…') || desc.endsWith('...');
  }

  protected canAnular(): boolean {
    const estado = this.solicitud?.estado;
    return estado === 'SOLICITADA' || estado === 'ACEPTADA';
  }

  protected anularActionLabel(estado: SolicitudExternaEstado): string {
    return estado === 'ACEPTADA' ? 'anular aceptación' : 'marcar denegada';
  }

  protected isRecommendationInFlight(alumno: TutorAlumno): boolean {
    return this.recommendationInFlight === `${alumno.id}:${this.offer.id}`;
  }

  protected hasRecommendationSent(alumno: TutorAlumno): boolean {
    return this.sentRecommendationKeys.has(`${alumno.id}:${this.offer.id}`);
  }

  protected toggleRecommend(): void {
    this.recommendOpen.update((open) => !open);
  }

  @HostListener('document:click', ['$event'])
  protected closeRecommendOnOutsideClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    if (!target.closest('.recommend-wrap')) {
      this.recommendOpen.set(false);
    }
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

  protected salaryLabel(): string {
    const min = this.offer.salarioMinimo;
    const max = this.offer.salarioMaximo;
    if (min == null && max == null) {
      return 'No especificado';
    }
    const formatter = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    });
    const range = min != null && max != null && min !== max
      ? `${formatter.format(min)} - ${formatter.format(max)}`
      : formatter.format((max ?? min) ?? 0);
    return this.offer.salarioEstimado ? `${range} (estimado)` : range;
  }

  protected publishedLabel(): string {
    if (!this.offer.publicadoEn) {
      return 'No especificada';
    }
    const date = new Date(this.offer.publicadoEn);
    if (Number.isNaN(date.getTime())) {
      return this.offer.publicadoEn;
    }
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
