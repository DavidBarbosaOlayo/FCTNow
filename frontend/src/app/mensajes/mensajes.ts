import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContactoMensaje, Conversacion, Mensaje } from './mensajes.models';
import { MensajesService } from './mensajes.service';

type LoadStatus = 'loading' | 'loaded' | 'error';
type MessageStatus = 'idle' | 'loading' | 'error';
type ContactStatus = 'idle' | 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-mensajes-page',
  imports: [ReactiveFormsModule],
  template: `
    <main class="page-shell route-page mensajes-page">
      <section class="messages-shell" aria-label="Mensajes">
        <aside class="chat-list" aria-label="Conversaciones">
          <div class="messages-heading">
            <div>
              <p class="eyebrow">Mensajes</p>
              <h2>Chats</h2>
            </div>
            <button
              type="button"
              class="new-chat-button"
              aria-label="Iniciar chat"
              (click)="openContactSearch()"
            >
              +
            </button>
          </div>

          @if (creatingChat()) {
            <section class="contact-search" aria-label="Nuevo chat">
              <label for="contact-search">Buscar persona</label>
              <input
                id="contact-search"
                type="search"
                [formControl]="contactSearchControl"
                placeholder="Filtrar por nombre"
                (input)="searchContacts()"
              />

              @if (contactStatus() === 'loading') {
                <p class="state-copy compact">Buscando personas...</p>
              } @else if (contactStatus() === 'error') {
                <div class="message-alert compact" role="alert">
                  <strong>No se pudo buscar</strong>
                  <span>{{ contactErrorMessage() }}</span>
                </div>
              } @else if (contactos().length === 0) {
                <div class="empty-panel compact">
                  <strong>Sin personas compatibles</strong>
                  <span>No hay personas disponibles con ese filtro.</span>
                </div>
              } @else {
                <ul class="contact-list">
                  @for (contacto of contactos(); track contacto.id) {
                    <li>
                      <button
                        type="button"
                        class="contact-button"
                        [disabled]="creatingConversation() === contacto.id"
                        (click)="startConversation(contacto)"
                      >
                        <span class="avatar" aria-hidden="true">
                          {{ initials(contacto.displayName) }}
                        </span>
                        <span>
                          <strong>{{ contacto.displayName }}</strong>
                          <small>{{ contacto.cicloFormativo || contacto.familiaProfesional || 'Profesorado FCT' }}</small>
                        </span>
                      </button>
                    </li>
                  }
                </ul>
              }
            </section>
          }

          @if (status() === 'loading') {
            <p class="state-copy" aria-live="polite">Cargando conversaciones...</p>
          } @else if (status() === 'error') {
            <div class="message-alert" role="alert">
              <strong>No se pudieron cargar los chats</strong>
              <span>{{ errorMessage() }}</span>
            </div>
          } @else if (conversaciones().length === 0) {
            <div class="empty-panel">
              <strong>No tienes conversaciones abiertas</strong>
              <span>Usa el boton + para empezar un chat con alumnado o profesorado disponible.</span>
            </div>
          } @else {
            <ul class="conversation-list">
              @for (conversacion of conversaciones(); track conversacion.id) {
                <li>
                  <button
                    type="button"
                    class="conversation-button"
                    [class.is-active]="selectedConversationId() === conversacion.id"
                    (click)="selectConversation(conversacion)"
                  >
                    <span class="avatar" aria-hidden="true">
                      {{ initials(conversacion.otroParticipanteNombre) }}
                    </span>
                    <span class="conversation-copy">
                      <strong>{{ conversacion.titulo }}</strong>
                      <span>{{ conversacion.ultimoMensaje || 'Sin mensajes todavia' }}</span>
                    </span>
                    <time [attr.datetime]="conversacion.ultimoMensajeAt || conversacion.updatedAt">
                      {{ compactDate(conversacion.ultimoMensajeAt || conversacion.updatedAt) }}
                    </time>
                  </button>
                </li>
              }
            </ul>
          }
        </aside>

        <section class="chat-panel" aria-label="Conversacion seleccionada">
          @if (!selectedConversation()) {
            <div class="empty-thread">
              <p class="eyebrow">Selecciona un chat</p>
              <h2>Abre una conversacion para responder</h2>
              <p>Elige un chat de la lista para leer el historial y escribir un mensaje.</p>
            </div>
          } @else {
            <header class="thread-header">
              <span class="avatar large" aria-hidden="true">
                {{ initials(selectedConversation()?.otroParticipanteNombre || '') }}
              </span>
              <div>
                <p class="eyebrow">Conversacion</p>
                <h2>{{ selectedConversation()?.titulo }}</h2>
              </div>
            </header>

            <div class="thread-body" aria-live="polite">
              @if (messageStatus() === 'loading') {
                <p class="state-copy">Cargando mensajes...</p>
              } @else if (messageStatus() === 'error') {
                <div class="message-alert" role="alert">
                  <strong>No se pudo cargar la conversacion</strong>
                  <span>{{ threadErrorMessage() }}</span>
                </div>
              } @else if (mensajes().length === 0) {
                <div class="empty-panel">
                  <strong>Empieza la conversacion</strong>
                  <span>Escribe el primer mensaje de este chat.</span>
                </div>
              } @else {
                <ol class="message-list">
                  @for (mensaje of mensajes(); track mensaje.id) {
                    <li class="message-row" [class.is-own]="mensaje.propio">
                      <article class="message-bubble">
                        <div class="message-meta">
                          <strong>{{ mensaje.propio ? 'Tu' : mensaje.remitenteNombre }}</strong>
                          <time [attr.datetime]="mensaje.createdAt">
                            {{ fullDate(mensaje.createdAt) }}
                          </time>
                        </div>
                        <p>{{ mensaje.contenido }}</p>
                      </article>
                    </li>
                  }
                </ol>
              }
            </div>

            <form class="composer" (submit)="handleSubmit($event)">
              <label for="mensaje-contenido">Mensaje</label>
              <div class="composer-row">
                <textarea
                  id="mensaje-contenido"
                  rows="2"
                  [formControl]="messageControl"
                  placeholder="Escribe una respuesta..."
                  [attr.aria-invalid]="messageControl.invalid && messageControl.touched"
                  (keydown.enter)="sendWithEnter($event)"
                ></textarea>
                <button type="submit" [disabled]="!canSend()">
                  {{ sending() ? 'Enviando' : 'Enviar' }}
                </button>
              </div>
              @if (messageControl.invalid && messageControl.touched) {
                <p class="field-error">Escribe un mensaje antes de enviarlo.</p>
              }
            </form>
          }
        </section>
      </section>
    </main>
  `,
  styles: [
    `
      .mensajes-page {
        align-content: start;
        padding-top: 2rem;
      }

      .messages-shell {
        min-height: min(72vh, 44rem);
        display: grid;
        grid-template-columns: minmax(18rem, 0.36fr) minmax(0, 1fr);
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 0.5rem;
        background: var(--surface);
        box-shadow: var(--shadow-soft);
      }

      .chat-list,
      .chat-panel {
        min-width: 0;
      }

      .chat-list {
        border-right: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.35);
      }

      .messages-heading,
      .thread-header,
      .composer {
        padding: 1rem;
      }

      .messages-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }

      .messages-heading h2,
      .thread-header h2,
      .empty-thread h2 {
        margin: 0.2rem 0 0;
        font-family: inherit;
        font-size: 1.2rem;
        line-height: 1.2;
      }

      .new-chat-button {
        width: 2.35rem;
        height: 2.35rem;
        border: 0;
        border-radius: 999px;
        color: #f7fbf8;
        background: var(--accent);
        font: inherit;
        font-size: 1.35rem;
        font-weight: 900;
        cursor: pointer;
      }

      .new-chat-button:hover,
      .new-chat-button:focus-visible {
        background: #0b5f59;
        outline: none;
      }

      .contact-search {
        display: grid;
        gap: 0.65rem;
        padding: 0 1rem 1rem;
      }

      .contact-search label {
        font-weight: 800;
      }

      .contact-search input {
        width: 100%;
        min-height: 2.65rem;
        padding: 0 0.75rem;
        border: 1px solid var(--line);
        border-radius: 0.5rem;
        color: var(--ink);
        background: rgba(255, 255, 255, 0.82);
        font: inherit;
        outline: none;
      }

      .contact-search input:focus-visible {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.16);
      }

      .conversation-list,
      .message-list,
      .contact-list {
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .conversation-list {
        display: grid;
      }

      .contact-list {
        display: grid;
        gap: 0.4rem;
        max-height: 14rem;
        overflow: auto;
      }

      .conversation-button {
        width: 100%;
        min-height: 4.6rem;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 0.75rem;
        align-items: center;
        padding: 0.75rem 1rem;
        border: 0;
        border-top: 1px solid var(--line);
        color: var(--ink);
        background: transparent;
        font: inherit;
        text-align: left;
        cursor: pointer;
      }

      .contact-button {
        width: 100%;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 0.65rem;
        align-items: center;
        padding: 0.55rem;
        border: 1px solid var(--line);
        border-radius: 0.5rem;
        color: var(--ink);
        background: rgba(255, 255, 255, 0.62);
        font: inherit;
        text-align: left;
        cursor: pointer;
      }

      .contact-button span:last-child {
        min-width: 0;
        display: grid;
      }

      .contact-button small {
        overflow: hidden;
        color: var(--muted);
        font-size: 0.78rem;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .conversation-button:hover,
      .conversation-button:focus-visible,
      .conversation-button.is-active,
      .contact-button:hover:not(:disabled),
      .contact-button:focus-visible:not(:disabled) {
        background: rgba(15, 118, 110, 0.09);
        outline: none;
      }

      .contact-button:disabled {
        cursor: progress;
        opacity: 0.64;
      }

      .avatar {
        width: 2.45rem;
        height: 2.45rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        color: #f7fbf8;
        background: var(--accent);
        font-size: 0.82rem;
        font-weight: 900;
      }

      .avatar.large {
        width: 3rem;
        height: 3rem;
      }

      .conversation-copy {
        min-width: 0;
        display: grid;
        gap: 0.2rem;
      }

      .conversation-copy strong,
      .conversation-copy span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .conversation-copy span,
      .conversation-button time,
      .state-copy,
      .empty-panel span,
      .empty-thread p:not(.eyebrow),
      .message-meta time {
        color: var(--muted);
      }

      .conversation-copy span,
      .conversation-button time,
      .message-meta time {
        font-size: 0.84rem;
      }

      .chat-panel {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr) auto;
      }

      .thread-header {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        border-bottom: 1px solid var(--line);
      }

      .thread-body {
        min-height: 0;
        overflow: auto;
        padding: 1rem;
      }

      .message-list {
        display: grid;
        gap: 0.65rem;
      }

      .message-row {
        display: flex;
        justify-content: flex-start;
      }

      .message-row.is-own {
        justify-content: flex-end;
      }

      .message-bubble {
        max-width: min(36rem, 82%);
        padding: 0.72rem 0.85rem;
        border: 1px solid var(--line);
        border-radius: 0.5rem;
        background: rgba(255, 255, 255, 0.78);
      }

      .message-row.is-own .message-bubble {
        color: #f7fbf8;
        border-color: transparent;
        background: var(--accent);
      }

      .message-row.is-own .message-meta time {
        color: rgba(247, 251, 248, 0.78);
      }

      .message-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
        align-items: baseline;
        margin-bottom: 0.35rem;
      }

      .message-bubble p {
        margin: 0;
        line-height: 1.45;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }

      .composer {
        border-top: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.42);
      }

      .composer label {
        display: block;
        margin-bottom: 0.45rem;
        font-weight: 800;
      }

      .composer-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 0.6rem;
        align-items: end;
      }

      .composer textarea {
        width: 100%;
        min-height: 3rem;
        max-height: 8rem;
        resize: vertical;
        padding: 0.72rem 0.85rem;
        border: 1px solid var(--line);
        border-radius: 0.5rem;
        color: var(--ink);
        background: rgba(255, 255, 255, 0.82);
        font: inherit;
        outline: none;
      }

      .composer textarea:focus-visible {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.16);
      }

      .composer button {
        min-height: 3rem;
        padding: 0 1rem;
        border: 0;
        border-radius: 0.5rem;
        color: #f7fbf8;
        background: var(--accent);
        font: inherit;
        font-weight: 800;
        cursor: pointer;
      }

      .composer button:disabled {
        color: rgba(25, 36, 47, 0.52);
        background: rgba(25, 36, 47, 0.12);
        cursor: not-allowed;
      }

      .empty-thread,
      .empty-panel,
      .message-alert,
      .state-copy {
        margin: 1rem;
      }

      .compact {
        margin: 0;
      }

      .empty-thread,
      .empty-panel,
      .message-alert {
        padding: 1rem;
        border: 1px solid var(--line);
        border-radius: 0.5rem;
        background: rgba(255, 255, 255, 0.56);
      }

      .empty-thread {
        align-self: center;
        justify-self: center;
        max-width: 28rem;
        text-align: center;
      }

      .message-alert {
        display: grid;
        gap: 0.25rem;
        border-color: rgba(184, 79, 59, 0.28);
        color: #8f3324;
        background: rgba(255, 246, 241, 0.9);
      }

      @media (max-width: 860px) {
        .messages-shell {
          grid-template-columns: 1fr;
        }

        .chat-list {
          border-right: 0;
          border-bottom: 1px solid var(--line);
        }

        .conversation-list {
          max-height: 18rem;
          overflow: auto;
        }
      }

      @media (max-width: 560px) {
        .messages-shell {
          min-height: auto;
        }

        .composer-row {
          grid-template-columns: 1fr;
        }

        .message-bubble {
          max-width: 92%;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MensajesPage implements OnInit {
  private readonly mensajesService = inject(MensajesService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly status = signal<LoadStatus>('loading');
  protected readonly messageStatus = signal<MessageStatus>('idle');
  protected readonly conversaciones = signal<Conversacion[]>([]);
  protected readonly selectedConversationId = signal<number | null>(null);
  protected readonly mensajes = signal<Mensaje[]>([]);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly threadErrorMessage = signal<string | null>(null);
  protected readonly contactErrorMessage = signal<string | null>(null);
  protected readonly sending = signal(false);
  protected readonly creatingChat = signal(false);
  protected readonly contactStatus = signal<ContactStatus>('idle');
  protected readonly contactos = signal<ContactoMensaje[]>([]);
  protected readonly creatingConversation = signal<number | null>(null);
  protected readonly messageControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(2000)],
  });
  protected readonly contactSearchControl = new FormControl('', { nonNullable: true });
  protected readonly selectedConversation = computed(() =>
    this.conversaciones().find((item) => item.id === this.selectedConversationId()) ?? null,
  );

  ngOnInit(): void {
    this.loadConversaciones();
  }

  protected canSend(): boolean {
    return (
      this.selectedConversation() !== null &&
      this.messageControl.valid &&
      this.messageControl.value.trim().length > 0 &&
      !this.sending()
    );
  }

  protected selectConversation(conversacion: Conversacion): void {
    if (this.selectedConversationId() === conversacion.id) {
      return;
    }
    this.selectedConversationId.set(conversacion.id);
    this.mensajesService.markConversationSeen(conversacion.id, conversacion.updatedAt);
    this.loadMensajes(conversacion.id);
  }

  protected openContactSearch(): void {
    this.creatingChat.update((value) => !value);
    if (this.creatingChat() && this.contactStatus() === 'idle') {
      this.searchContacts();
    }
  }

  protected searchContacts(): void {
    this.contactStatus.set('loading');
    this.contactErrorMessage.set(null);
    this.mensajesService
      .buscarContactos(this.contactSearchControl.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.contactos.set(items);
          this.contactStatus.set('loaded');
        },
        error: (error: unknown) => {
          this.contactos.set([]);
          this.contactErrorMessage.set(messageErrorMessage(error));
          this.contactStatus.set('error');
        },
      });
  }

  protected startConversation(contacto: ContactoMensaje): void {
    if (this.creatingConversation() !== null) {
      return;
    }
    this.creatingConversation.set(contacto.id);
    this.mensajesService
      .crearConversacion({ contactoId: contacto.id })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (conversacion) => {
          this.creatingConversation.set(null);
          this.creatingChat.set(false);
          this.conversaciones.update((items) => upsertConversation(items, conversacion));
          this.selectConversation(conversacion);
        },
        error: (error: unknown) => {
          this.creatingConversation.set(null);
          this.contactErrorMessage.set(messageErrorMessage(error));
          this.contactStatus.set('error');
        },
      });
  }

  protected sendWithEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.shiftKey) {
      return;
    }
    keyboardEvent.preventDefault();
    this.sendMessage();
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    this.sendMessage();
  }

  protected sendMessage(): void {
    const conversacion = this.selectedConversation();
    const contenido = this.messageControl.value.trim();
    if (!conversacion || contenido.length === 0 || this.sending()) {
      this.messageControl.markAsTouched();
      return;
    }

    this.sending.set(true);
    this.mensajesService
      .enviarMensaje(conversacion.id, { contenido })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (mensaje) => {
          this.sending.set(false);
          this.messageControl.setValue('');
          this.messageControl.markAsUntouched();
          this.mensajes.update((items) => [...items, mensaje]);
          this.conversaciones.update((items) => moveConversationToTop(items, conversacion.id, mensaje));
        },
        error: (error: unknown) => {
          this.sending.set(false);
          this.threadErrorMessage.set(messageErrorMessage(error));
          this.messageStatus.set('error');
        },
      });
  }

  protected initials(value: string): string {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return 'CH';
    }
    return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('');
  }

  protected compactDate(value: string): string {
    return formatDate(value, { dateStyle: 'short' });
  }

  protected fullDate(value: string): string {
    return formatDate(value, { dateStyle: 'medium', timeStyle: 'short' });
  }

  private loadConversaciones(): void {
    this.status.set('loading');
    this.errorMessage.set(null);
    this.mensajesService
      .listConversaciones()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.conversaciones.set(items);
          this.status.set('loaded');
          if (items.length > 0 && this.selectedConversationId() === null) {
            this.selectConversation(items[0]);
          }
        },
        error: (error: unknown) => {
          this.conversaciones.set([]);
          this.errorMessage.set(messageErrorMessage(error));
          this.status.set('error');
        },
      });
  }

  private loadMensajes(conversacionId: number): void {
    this.messageStatus.set('loading');
    this.threadErrorMessage.set(null);
    this.mensajesService
      .listMensajes(conversacionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.mensajes.set(items);
          this.messageStatus.set('idle');
        },
        error: (error: unknown) => {
          this.mensajes.set([]);
          this.threadErrorMessage.set(messageErrorMessage(error));
          this.messageStatus.set('error');
        },
      });
  }
}

function moveConversationToTop(
  conversaciones: Conversacion[],
  conversacionId: number,
  mensaje: Mensaje,
): Conversacion[] {
  const updated = conversaciones.map((item) =>
    item.id === conversacionId
      ? {
          ...item,
          ultimoMensaje: mensaje.contenido,
          ultimoMensajeAt: mensaje.createdAt,
          ultimoMensajePropio: true,
          updatedAt: mensaje.createdAt,
        }
      : item,
  );
  return updated.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

function upsertConversation(
  conversaciones: Conversacion[],
  conversacion: Conversacion,
): Conversacion[] {
  const withoutCurrent = conversaciones.filter((item) => item.id !== conversacion.id);
  return [conversacion, ...withoutCurrent].sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );
}

function formatDate(value: string, options: Intl.DateTimeFormatOptions): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('es-ES', options).format(date);
}

function messageErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 401) {
      return 'Inicia sesion para consultar tus mensajes.';
    }
    if (error.status === 404) {
      return 'La conversacion no existe o no pertenece a tu usuario.';
    }
    if (error.status === 0) {
      return 'No se pudo contactar con el backend. Comprueba que el servidor este disponible.';
    }
  }
  return 'Intentelo de nuevo mas tarde.';
}
