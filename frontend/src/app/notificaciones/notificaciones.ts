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
import { Router } from '@angular/router';
import { Notificacion } from './notificaciones.models';
import { NotificacionesService } from './notificaciones.service';

type NotificationStatus = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-notificaciones-page',
  imports: [],
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
                    <a
                      class="primary-action"
                      [href]="notificacion.actionUrl"
                      (click)="handleActionClick($event, notificacion)"
                    >
                      {{ notificacion.actionLabel || 'Ir a la oferta' }}
                    </a>
                  } @else {
                    <a
                      class="primary-action"
                      [href]="notificacion.actionUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      (click)="markReadOnAction(notificacion)"
                    >
                      {{ notificacion.actionLabel || 'Ir a la oferta' }}
                    </a>
                  }
                }

                @if (!notificacion.leida) {
                  <button
                    type="button"
                    class="secondary-action"
                    [disabled]="markingRead() === notificacion.id || deletingNotification() === notificacion.id"
                    (click)="marcarLeida(notificacion)"
                  >
                    Marcar como leída
                  </button>
                } @else {
                  <span class="read-badge">Leída</span>
                }

                <button
                  type="button"
                  class="delete-notification"
                  [disabled]="deletingNotification() === notificacion.id"
                  [attr.aria-label]="'Eliminar notificación ' + notificacion.titulo"
                  (click)="deleteNotification(notificacion)"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.7 11H7.7L7 9Zm3 2 .3 7h1.4l-.2-7H10Zm3.5 0-.2 7h1.4l.3-7h-1.5Z" />
                  </svg>
                </button>
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
        border-radius: var(--radius-md);
        background: var(--surface);
        box-shadow: none;
      }

      .route-panel {
        padding: 1.2rem;
      }

      .route-panel.alert {
        border-color: rgba(179, 38, 30, 0.32);
        background: var(--danger-soft);
      }

      .notification-card {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 1rem;
        align-items: center;
        padding: 1rem 1.15rem;
        transition: border-color 140ms ease;
      }

      .notification-card:hover {
        border-color: var(--line-strong);
      }

      .notification-card.is-read .notification-copy {
        opacity: 0.72;
      }

      .notification-copy {
        display: grid;
        gap: 0.3rem;
      }

      .notification-copy h2,
      .route-panel h2 {
        margin: 0;
        font-family: inherit;
        line-height: 1.25;
        font-weight: 700;
        letter-spacing: -0.012em;
      }

      .notification-copy h2 {
        font-size: 1.02rem;
        font-weight: 600;
      }

      .notification-copy p:not(.eyebrow),
      .route-panel p:not(.eyebrow) {
        margin: 0;
        color: var(--muted);
        line-height: 1.55;
        font-size: 0.93rem;
      }

      .notification-copy time {
        color: var(--muted);
        font-size: 0.8rem;
        font-weight: 500;
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
        min-height: 2.4rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 0.95rem;
        border-radius: var(--radius-md);
        font: inherit;
        font-weight: 600;
        font-size: 0.9rem;
      }

      .primary-action {
        border: 1px solid var(--accent);
        color: #ffffff;
        background: var(--accent);
        text-decoration: none;
        transition: background-color 140ms ease, border-color 140ms ease;
      }

      .secondary-action {
        border: 1px solid var(--line-strong);
        color: var(--ink);
        background: var(--surface);
        cursor: pointer;
        transition: background-color 140ms ease, border-color 140ms ease;
      }

      .primary-action:hover,
      .primary-action:focus-visible {
        background: var(--accent-hover);
        border-color: var(--accent-hover);
        outline: none;
      }

      .secondary-action:hover:not(:disabled),
      .secondary-action:focus-visible:not(:disabled) {
        background: var(--surface-muted);
        border-color: var(--ink-soft);
        outline: none;
      }

      .secondary-action:disabled {
        cursor: progress;
        opacity: 0.64;
      }

      .read-badge {
        color: var(--accent);
        background: var(--accent-soft);
        border: 1px solid rgba(17, 78, 74, 0.22);
      }

      .delete-notification {
        width: 2.4rem;
        min-height: 2.4rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(179, 38, 30, 0.34);
        border-radius: var(--radius-md);
        color: var(--danger);
        background: var(--danger-soft);
        cursor: pointer;
        transition: background-color 140ms ease, border-color 140ms ease;
      }

      .delete-notification:hover,
      .delete-notification:focus-visible {
        border-color: rgba(179, 38, 30, 0.54);
        filter: brightness(0.96);
        outline: none;
      }

      .delete-notification:disabled {
        cursor: progress;
        opacity: 0.64;
      }

      .delete-notification svg {
        width: 1.1rem;
        height: 1.1rem;
        fill: currentColor;
      }

      :host-context(.theme-dark) .delete-notification {
        border-color: rgba(255, 138, 128, 0.42);
      }

      :host-context(.theme-dark) .delete-notification:hover,
      :host-context(.theme-dark) .delete-notification:focus-visible {
        border-color: rgba(255, 138, 128, 0.62);
        filter: brightness(1.1);
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
  private readonly router = inject(Router);

  protected readonly status = signal<NotificationStatus>('loading');
  protected readonly notificaciones = signal<Notificacion[]>([]);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly markingRead = signal<number | null>(null);
  protected readonly deletingNotification = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected marcarLeida(notificacion: Notificacion): void {
    if (this.markingRead() !== null || this.deletingNotification() === notificacion.id) {
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

  protected deleteNotification(notificacion: Notificacion): void {
    if (this.deletingNotification() !== null) {
      return;
    }
    this.deletingNotification.set(notificacion.id);
    this.notificacionesService
      .delete(notificacion.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deletingNotification.set(null);
          this.notificaciones.update((items) => items.filter((item) => item.id !== notificacion.id));
        },
        error: (error: unknown) => {
          this.deletingNotification.set(null);
          this.errorMessage.set(notificationErrorMessage(error));
          this.status.set('error');
        },
      });
  }

  protected tipoLabel(notificacion: Notificacion): string {
    const labels: Record<Notificacion['tipo'], string> = {
      RECOMENDACION: 'Recomendación',
      SOLICITUD_RECIBIDA: 'Solicitud recibida',
      SOLICITUD_ACEPTADA: 'Solicitud aceptada',
      SOLICITUD_RECHAZADA: 'Solicitud rechazada',
      SOLICITUD_ACEPTADA_PENDIENTE_ASIGNACION: 'Pendiente de asignación',
      ASIGNACION_CREADA: 'Práctica asignada',
      OFERTA_PUBLICADA: 'Oferta publicada',
      OFERTA_MODIFICADA: 'Oferta modificada',
      DOCUMENTACION_PENDIENTE: 'Documentación pendiente',
      SEGUIMIENTO_PENDIENTE: 'Seguimiento pendiente',
      EVALUACION_PENDIENTE: 'Evaluación pendiente',
      INCIDENCIA_REGISTRADA: 'Incidencia registrada',
    };
    return labels[notificacion.tipo];
  }

  protected isInternalUrl(url: string): boolean {
    return url.startsWith('/');
  }

  protected handleActionClick(event: MouseEvent, notificacion: Notificacion): void {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      this.markReadOnAction(notificacion);
      return;
    }
    event.preventDefault();
    this.markReadOnAction(notificacion);
    if (notificacion.actionUrl) {
      this.router.navigateByUrl(notificacion.actionUrl);
    }
  }

  protected markReadOnAction(notificacion: Notificacion): void {
    if (notificacion.leida) {
      return;
    }
    this.notificacionesService
      .marcarLeida(notificacion.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.notificaciones.update((items) =>
            items.map((item) => (item.id === updated.id ? updated : item)),
          );
        },
        error: () => {
          // silently ignore — la navegación es lo importante
        },
      });
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
      return 'Inicia sesión para ver tus notificaciones.';
    }
    if (error.status === 403) {
      return 'No tienes permisos para consultar esta bandeja.';
    }
    if (error.status === 0) {
      return 'No se pudo contactar con el backend. Comprueba que el servidor esté disponible.';
    }
  }
  return 'Inténtalo de nuevo más tarde.';
}
