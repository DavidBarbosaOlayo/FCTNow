import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Notificacion } from './notificaciones.models';
import { NotificacionesService } from './notificaciones.service';

type NotificationStatus = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-notificaciones-page',
  imports: [RouterLink],
  template: `
    <main class="page-shell route-page notificaciones-page">
      @if (status() === 'loading') {
        <section class="route-panel" aria-live="polite">
          <p class="eyebrow">Cargando</p>
          <h2>Consultando tus notificaciones</h2>
        </section>
      } @else if (status() === 'error') {
        <section class="route-panel alert" role="alert">
          <p class="eyebrow">Error</p>
          <h2>No se pudieron cargar las notificaciones</h2>
          <p>{{ errorMessage() }}</p>
        </section>
      } @else if (notificaciones().length === 0) {
        <section class="route-panel">
          <p class="eyebrow">Sin avisos</p>
          <h2>No tienes notificaciones pendientes</h2>
          <p>Cuando un tutor o coordinador te recomiende una oferta, aparecerá aquí.</p>
        </section>
      } @else {
        <section class="notifications-list" aria-label="Notificaciones recientes">
          @for (notificacion of notificaciones(); track notificacion.id) {
            <article class="notification-card" [class.is-read]="notificacion.leida">
              <div class="notification-copy">
                <p class="eyebrow">{{ tipoLabel(notificacion) }}</p>
                <h2>{{ notificacion.titulo }}</h2>
                @if (notificacion.mensaje) {
                  <p>{{ notificacion.mensaje }}</p>
                }
                <time [attr.datetime]="notificacion.createdAt">
                  {{ dateLabel(notificacion.createdAt) }}
                </time>
              </div>

              <div class="notification-actions">
                @if (notificacion.actionUrl) {
                  @if (isInternalUrl(notificacion.actionUrl)) {
                    <a class="primary-action" [routerLink]="notificacion.actionUrl">
                      {{ notificacion.actionLabel || 'Ir a la oferta' }}
                    </a>
                  } @else {
                    <a
                      class="primary-action"
                      [href]="notificacion.actionUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {{ notificacion.actionLabel || 'Ir a la oferta' }}
                    </a>
                  }
                }

                @if (!notificacion.leida) {
                  <button
                    type="button"
                    class="secondary-action"
                    [disabled]="markingRead() === notificacion.id"
                    (click)="marcarLeida(notificacion)"
                  >
                    Marcar como leída
                  </button>
                } @else {
                  <span class="read-badge">Leída</span>
                }
              </div>
            </article>
          }
        </section>
      }
    </main>
  `,
  styles: [
    `
      .notificaciones-page {
        align-content: start;
        gap: 1rem;
        padding-top: 2rem;
      }

      .notifications-list {
        display: grid;
        gap: 0.85rem;
      }

      .notification-card,
      .route-panel {
        border: 1px solid var(--line);
        border-radius: 0.5rem;
        background: var(--surface);
        box-shadow: var(--shadow-soft);
        backdrop-filter: blur(14px);
      }

      .route-panel {
        padding: 1.2rem;
      }

      .route-panel.alert {
        border-color: rgba(184, 79, 59, 0.28);
        background: rgba(255, 246, 241, 0.9);
      }

      .notification-card {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 1rem;
        align-items: center;
        padding: 1rem;
      }

      .notification-card.is-read {
        opacity: 0.72;
      }

      .notification-copy {
        display: grid;
        gap: 0.35rem;
      }

      .notification-copy h2,
      .route-panel h2 {
        margin: 0;
        font-family: inherit;
        line-height: 1.2;
      }

      .notification-copy h2 {
        font-size: 1.15rem;
      }

      .notification-copy p:not(.eyebrow),
      .route-panel p:not(.eyebrow) {
        margin: 0;
        color: var(--muted);
        line-height: 1.55;
      }

      .notification-copy time {
        color: var(--muted);
        font-size: 0.85rem;
        font-weight: 700;
      }

      .notification-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 0.5rem;
      }

      .primary-action,
      .secondary-action,
      .read-badge {
        min-height: 2.55rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 0.9rem;
        border-radius: 0.5rem;
        font: inherit;
        font-weight: 800;
      }

      .primary-action {
        border: 0;
        color: #f7fbf8;
        background: var(--accent);
        text-decoration: none;
      }

      .secondary-action {
        border: 1px solid var(--line);
        color: var(--ink);
        background: rgba(255, 255, 255, 0.64);
        cursor: pointer;
      }

      .primary-action:hover,
      .primary-action:focus-visible {
        background: #0b5f59;
        outline: none;
      }

      .secondary-action:hover:not(:disabled),
      .secondary-action:focus-visible:not(:disabled) {
        border-color: rgba(15, 118, 110, 0.36);
        outline: none;
      }

      .secondary-action:disabled {
        cursor: progress;
        opacity: 0.64;
      }

      .read-badge {
        color: var(--accent);
        background: rgba(15, 118, 110, 0.1);
      }

      @media (max-width: 720px) {
        .notification-card {
          grid-template-columns: 1fr;
        }

        .notification-actions {
          justify-content: flex-start;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificacionesPage implements OnInit {
  private readonly notificacionesService = inject(NotificacionesService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly status = signal<NotificationStatus>('loading');
  protected readonly notificaciones = signal<Notificacion[]>([]);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly markingRead = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected marcarLeida(notificacion: Notificacion): void {
    if (this.markingRead() !== null) {
      return;
    }
    this.markingRead.set(notificacion.id);
    this.notificacionesService
      .marcarLeida(notificacion.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.markingRead.set(null);
          this.notificaciones.update((items) =>
            items.map((item) => (item.id === updated.id ? updated : item)),
          );
        },
        error: (error: unknown) => {
          this.markingRead.set(null);
          this.errorMessage.set(notificationErrorMessage(error));
          this.status.set('error');
        },
      });
  }

  protected tipoLabel(notificacion: Notificacion): string {
    return notificacion.tipo === 'RECOMENDACION' ? 'Recomendación' : notificacion.tipo;
  }

  protected isInternalUrl(url: string): boolean {
    return url.startsWith('/');
  }

  protected dateLabel(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  private load(): void {
    this.status.set('loading');
    this.errorMessage.set(null);
    this.notificacionesService
      .listMine()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.notificaciones.set(items);
          this.status.set('loaded');
        },
        error: (error: unknown) => {
          this.notificaciones.set([]);
          this.errorMessage.set(notificationErrorMessage(error));
          this.status.set('error');
        },
      });
  }
}

function notificationErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 401) {
      return 'Inicia sesión con tu cuenta de alumno para ver tus notificaciones.';
    }
    if (error.status === 403) {
      return 'Solo el alumnado puede consultar esta bandeja.';
    }
    if (error.status === 0) {
      return 'No se pudo contactar con el backend. Comprueba que el servidor esté disponible.';
    }
  }
  return 'Inténtalo de nuevo más tarde.';
}
