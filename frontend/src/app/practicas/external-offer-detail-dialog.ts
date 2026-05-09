import { Component, EventEmitter, Input, Output } from '@angular/core';
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
          @if (canAnular()) {
            <button
              type="button"
              class="action-link tracking"
              [class.is-aceptada]="solicitud?.estado === 'ACEPTADA'"
              [disabled]="actionInFlight"
              (click)="anular.emit()"
            >
              <span class="state">{{ estadoLabel(solicitud!.estado) }} · pulsa para anular</span>
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
        border-radius: 0.5rem;
        background: var(--surface-strong);
        box-shadow: var(--shadow-soft);
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
        font-size: 1.55rem;
      }

      .title-row {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 0.55rem 0.75rem;
        margin: 0.25rem 0 0;
      }

      .published-badge {
        display: inline-flex;
        align-items: center;
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        background: rgba(15, 118, 110, 0.12);
        color: var(--accent);
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .heading p:not(.eyebrow),
      .description p {
        margin: 0.4rem 0 0;
        color: var(--muted);
        line-height: 1.6;
      }

      .detail-close-action {
        width: 2.25rem;
        height: 2.25rem;
        border: 1px solid var(--line);
        border-radius: 999px;
        color: var(--ink);
        background: rgba(255, 255, 255, 0.78);
        font: inherit;
        font-size: 1.35rem;
        line-height: 1;
        cursor: pointer;
      }

      .detail-close-action:hover,
      .detail-close-action:focus-visible {
        border-color: rgba(15, 118, 110, 0.36);
        outline: none;
      }

      .detail-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.6rem;
        margin: 0;
      }

      .detail-grid div {
        padding: 0.75rem;
        border: 1px solid var(--line);
        border-radius: 0.45rem;
        background: rgba(255, 251, 245, 0.72);
      }

      .detail-grid dt {
        color: var(--muted);
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .detail-grid dd {
        margin: 0.25rem 0 0;
        color: var(--ink);
        font-weight: 700;
        line-height: 1.35;
        overflow-wrap: anywhere;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .action-link {
        min-height: 2.75rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 1rem;
        border: 0;
        border-radius: 0.5rem;
        color: #f7fbf8;
        background: var(--accent);
        font: inherit;
        font-weight: 800;
        text-decoration: none;
        cursor: pointer;
      }

      .action-link.secondary {
        border: 1px solid var(--line);
        color: var(--ink);
        background: rgba(255, 255, 255, 0.68);
      }

      .action-link.tracking {
        border: 1px solid rgba(15, 118, 110, 0.32);
        color: var(--accent);
        background: rgba(15, 118, 110, 0.14);
        font-weight: 800;
      }

      .action-link.tracking.idle {
        border-color: rgba(15, 118, 110, 0.4);
        background: rgba(15, 118, 110, 0.18);
      }

      .action-link.tracking.is-aceptada {
        border-color: rgba(11, 95, 89, 0.42);
        background: rgba(15, 118, 110, 0.22);
        color: #0b5f59;
      }

      .action-link.tracking:hover:not(:disabled),
      .action-link.tracking:focus-visible:not(:disabled) {
        outline: none;
      }

      .action-link.tracking:not(.idle):hover:not(:disabled),
      .action-link.tracking:not(.idle):focus-visible:not(:disabled) {
        border-color: rgba(184, 79, 59, 0.5);
        background: rgba(184, 79, 59, 0.16);
        color: #b8423b;
      }

      .action-link.tracking:disabled {
        cursor: progress;
        opacity: 0.65;
      }

      .description {
        display: flex;
        flex-direction: column;
      }

      .description-body {
        margin-top: 0.4rem;
        padding-left: 0.85rem;
        border-left: 3px solid rgba(15, 118, 110, 0.18);
        max-height: 22rem;
        overflow-y: auto;
        padding-right: 0.6rem;
      }

      .description-body p {
        margin: 0;
        white-space: pre-line;
        color: var(--ink);
        line-height: 1.6;
      }

      .description-source {
        margin: 0.6rem 0 0;
        padding: 0.55rem 0.75rem;
        border-radius: 0.45rem;
        background: rgba(199, 101, 59, 0.12);
        color: var(--ink);
        font-size: 0.85rem;
        line-height: 1.5;
      }

      .description-source a {
        color: var(--accent);
        font-weight: 800;
        text-decoration: underline;
        text-underline-offset: 0.2rem;
      }

      .description-source a:hover,
      .description-source a:focus-visible {
        color: #0b5f59;
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
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly solicit = new EventEmitter<void>();
  @Output() readonly anular = new EventEmitter<void>();

  protected get isAdzunaTruncated(): boolean {
    const desc = this.offer.descripcion ?? '';
    return desc.endsWith('…') || desc.endsWith('...');
  }

  protected canAnular(): boolean {
    const estado = this.solicitud?.estado;
    return estado === 'SOLICITADA' || estado === 'ACEPTADA';
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
