import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OfertaModalidad } from '../practicas/ofertas.models';
import { RecommendedHomeOffer } from './home.models';

@Component({
  selector: 'app-home-offer-detail-dialog',
  imports: [RouterLink],
  template: `
    <div class="backdrop" role="presentation" (click)="closed.emit()">
      <section
        class="dialog"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="'home-offer-detail-title-' + offer.id"
        (click)="$event.stopPropagation()"
      >
        <header class="heading">
          <div>
            <p class="eyebrow">
              {{ offer.source === 'EXTERNA' ? 'Oferta externa · Adzuna' : 'Oferta FCTNow' }}
            </p>
            <h2 [id]="'home-offer-detail-title-' + offer.id">{{ offer.title }}</h2>
            <p class="company">{{ offer.company }}</p>
          </div>
          <button type="button" class="close-action" aria-label="Cerrar detalle" (click)="closed.emit()">
            ×
          </button>
        </header>

        <dl class="detail-grid">
          <div>
            <dt>Localidad</dt>
            <dd>{{ offer.location || 'No especificada' }}</dd>
          </div>
          <div>
            <dt>{{ offer.source === 'EXTERNA' ? 'Origen' : 'Modalidad' }}</dt>
            <dd>{{ offer.source === 'EXTERNA' ? 'Adzuna' : modalityLabel(offer.modality) }}</dd>
          </div>
          <div>
            <dt>Actualizada</dt>
            <dd>{{ formatDate(offer.publishedAt) }}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>{{ offer.statusLabel }}</dd>
          </div>
        </dl>

        @if (offer.matchReasons.length > 0) {
          <section class="match-section" aria-label="Motivos de recomendación">
            <p class="eyebrow">Por qué encaja contigo</p>
            <ul class="match-list">
              @for (reason of offer.matchReasons; track reason) {
                <li>{{ reason }}</li>
              }
            </ul>
          </section>
        }

        <footer class="actions">
          @if (offer.externalUrl) {
            <a class="primary-action" [href]="offer.externalUrl" target="_blank" rel="noopener noreferrer">
              Solicitar en Adzuna
            </a>
          } @else if (offer.offerId) {
            <a class="primary-action" [routerLink]="['/practicas', offer.offerId]" (click)="closed.emit()">
              Abrir en catálogo
            </a>
          }
          <button type="button" class="secondary-action" (click)="closed.emit()">Cerrar</button>
        </footer>
      </section>
    </div>
  `,
  styles: [
    `
      .backdrop {
        position: fixed;
        inset: 0;
        z-index: 30;
        display: grid;
        place-items: center;
        padding: 1rem;
        background: rgba(10, 15, 20, 0.5);
      }

      .dialog {
        width: min(100%, 38rem);
        max-height: min(86vh, 44rem);
        overflow: auto;
        display: grid;
        gap: 1.1rem;
        padding: 1.4rem;
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

      .eyebrow {
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.7rem;
        font-weight: 700;
        color: var(--accent);
      }

      .heading h2 {
        margin: 0.3rem 0 0;
        font-family: inherit;
        font-size: 1.3rem;
        line-height: 1.25;
        font-weight: 700;
        letter-spacing: -0.015em;
        color: var(--ink);
      }

      .company {
        margin: 0.35rem 0 0;
        color: var(--muted);
        font-size: 0.95rem;
        font-weight: 500;
      }

      .close-action {
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
        transition: background-color 140ms ease, border-color 140ms ease;
      }

      .close-action:hover,
      .close-action:focus-visible {
        background: var(--surface-muted);
        border-color: var(--ink-soft);
        outline: none;
      }

      .detail-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
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

      .detail-grid div:nth-child(2n) {
        border-right: 0;
      }

      .detail-grid div:nth-last-child(-n+2) {
        border-bottom: 0;
      }

      .detail-grid dt {
        margin: 0;
        color: var(--muted);
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .detail-grid dd {
        margin: 0.2rem 0 0;
        color: var(--ink);
        font-weight: 600;
        line-height: 1.35;
        font-size: 0.9rem;
      }

      .match-section {
        display: grid;
        gap: 0.45rem;
      }

      .match-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
      }

      .match-list li {
        display: inline-flex;
        align-items: center;
        padding: 0.2rem 0.55rem;
        border-radius: var(--radius-sm);
        background: var(--accent-soft);
        color: var(--accent);
        font-size: 0.78rem;
        font-weight: 600;
        border: 1px solid rgba(31, 111, 99, 0.22);
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
      }

      .primary-action,
      .secondary-action {
        min-height: 2.4rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 1rem;
        border-radius: var(--radius-md);
        font: inherit;
        font-weight: 600;
        font-size: 0.9rem;
        text-decoration: none;
        cursor: pointer;
        transition: background-color 140ms ease, border-color 140ms ease;
      }

      .primary-action {
        color: #ffffff;
        background: var(--accent);
        border: 1px solid var(--accent);
      }

      .primary-action:hover,
      .primary-action:focus-visible {
        background: var(--accent-hover);
        border-color: var(--accent-hover);
        outline: none;
      }

      .secondary-action {
        color: var(--ink);
        background: var(--surface);
        border: 1px solid var(--line-strong);
      }

      .secondary-action:hover,
      .secondary-action:focus-visible {
        background: var(--surface-muted);
        border-color: var(--ink-soft);
        outline: none;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeOfferDetailDialog {
  @Input({ required: true }) offer!: RecommendedHomeOffer;
  @Output() readonly closed = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closed.emit();
  }

  protected modalityLabel(modality: OfertaModalidad | null): string {
    switch (modality) {
      case 'PRESENCIAL':
        return 'Presencial';
      case 'HIBRIDA':
        return 'Híbrida';
      case 'REMOTA':
        return 'Remota';
      default:
        return 'Sin modalidad definida';
    }
  }

  protected formatDate(value: string | null): string {
    if (!value) {
      return 'Fecha pendiente';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(parsed);
  }
}
