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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AsignacionExternaCandidata,
  AsignacionFctExterna,
} from './asignaciones-externas.models';
import { AsignacionesExternasService } from './asignaciones-externas.service';
import { AsignacionCandidata, AsignacionEstado, AsignacionFct } from './asignaciones.models';
import { AsignacionesService } from './asignaciones.service';

type ListStatus = 'loading' | 'loaded' | 'empty' | 'error' | 'not-authenticated';
type SaveStatus = 'idle' | 'saving';

@Component({
  selector: 'app-asignaciones-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="page-shell route-page asignaciones-page">
      <header class="route-hero">
        <p class="eyebrow">Centro</p>
        <h1>Asignaciones FCT</h1>
        <p>
          Registra el vinculo entre alumno, oferta y empresa cuando una solicitud queda aceptada,
          y consulta el listado de asignaciones activas.
        </p>
      </header>

      <section class="create-panel" aria-label="Crear asignacion">
        <p class="eyebrow">Nueva asignacion</p>
        <h2>Asignar desde solicitud aceptada</h2>
        @if (candidatasStatus() === 'loading') {
          <p class="muted">Cargando solicitudes pendientes de asignar...</p>
        } @else if (candidatas().length === 0) {
          <p class="muted">
            No hay solicitudes aceptadas pendientes de asignar. Cuando una empresa acepte una
            solicitud nueva, aparecera aqui para que la oficialices.
          </p>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="form-row">
              <label for="solicitudId">Solicitud aceptada</label>
              <select id="solicitudId" formControlName="solicitudId">
                <option [ngValue]="null">Selecciona una solicitud</option>
                @for (candidata of candidatas(); track candidata.solicitudId) {
                  <option [ngValue]="candidata.solicitudId">
                    {{ candidata.alumno.displayName }} — {{ candidata.oferta.titulo }} ({{
                      candidata.empresa.nombre
                    }})
                  </option>
                }
              </select>
            </div>
            <div class="form-row">
              <label for="observaciones">Observaciones (opcional)</label>
              <textarea
                id="observaciones"
                rows="3"
                maxlength="2000"
                formControlName="observaciones"
              ></textarea>
            </div>
            <div class="form-actions">
              <button
                type="submit"
                class="primary-action"
                [disabled]="saveStatus() === 'saving' || form.invalid"
              >
                @if (saveStatus() === 'saving') {
                  Guardando...
                } @else {
                  Crear asignacion
                }
              </button>
            </div>
          </form>
        }
        @if (createMessage(); as msg) {
          <p class="action-feedback" role="status">{{ msg }}</p>
        }
      </section>

      <section class="create-panel external-create-panel" aria-label="Crear asignacion externa">
        <p class="eyebrow">Ofertas externas · Adzuna</p>
        <h2>Asignar solicitud externa aceptada</h2>
        @if (candidatasExternasStatus() === 'loading') {
          <p class="muted">Cargando solicitudes externas aceptadas...</p>
        } @else if (candidatasExternas().length === 0) {
          <p class="muted">
            No hay solicitudes externas aceptadas pendientes de asignar. Cuando un alumno marque
            una oferta de Adzuna como aceptada, aparecera aqui.
          </p>
        } @else {
          <form [formGroup]="externalForm" (ngSubmit)="submitExternal()" novalidate>
            <div class="form-row">
              <label for="solicitudExternaId">Solicitud externa aceptada</label>
              <select id="solicitudExternaId" formControlName="solicitudExternaId">
                <option [ngValue]="null">Selecciona una solicitud externa</option>
                @for (candidata of candidatasExternas(); track candidata.solicitudExternaId) {
                  <option [ngValue]="candidata.solicitudExternaId">
                    {{ candidata.alumnoNombre }} — {{ candidata.titulo }} ({{
                      candidata.empresaNombre || 'Empresa externa'
                    }})
                  </option>
                }
              </select>
            </div>
            <div class="form-row">
              <label for="observacionesExternas">Observaciones (opcional)</label>
              <textarea
                id="observacionesExternas"
                rows="3"
                maxlength="2000"
                formControlName="observaciones"
              ></textarea>
            </div>
            <div class="form-actions">
              <button
                type="submit"
                class="primary-action"
                [disabled]="saveExternalStatus() === 'saving' || externalForm.invalid"
              >
                @if (saveExternalStatus() === 'saving') {
                  Guardando...
                } @else {
                  Crear asignacion externa
                }
              </button>
            </div>
          </form>
        }
        @if (externalCreateMessage(); as msg) {
          <p class="action-feedback" role="status">{{ msg }}</p>
        }
      </section>

      @if (status() === 'loading') {
        <section class="state-panel" aria-live="polite">
          <p class="eyebrow">Cargando</p>
          <h2>Recuperando las asignaciones</h2>
        </section>
      } @else if (status() === 'not-authenticated') {
        <section class="state-panel alert" role="alert">
          <p class="eyebrow">Sesion no disponible</p>
          <h2>Inicia sesion para gestionar las asignaciones</h2>
          <p>Necesitas una sesion activa de tutor o coordinador.</p>
          <a class="back-link" routerLink="/login">Ir al acceso</a>
        </section>
      } @else if (status() === 'error') {
        <section class="state-panel alert" role="alert">
          <p class="eyebrow">Error</p>
          <h2>No se pudieron cargar las asignaciones</h2>
          <p>{{ errorMessage() }}</p>
        </section>
      } @else if (status() === 'empty') {
        <section class="state-panel">
          <p class="eyebrow">Sin asignaciones</p>
          <h2>Aun no hay asignaciones registradas</h2>
          <p>Cuando una empresa acepte una solicitud, podras registrarla desde el formulario.</p>
        </section>
      } @else {
        <section class="asignaciones-results" aria-live="polite" aria-label="Asignaciones FCT">
          <div class="results-heading">
            <p class="eyebrow">Asignaciones</p>
            <h2>{{ resultsTitle() }}</h2>
          </div>

          <div class="asignaciones-grid">
            @for (asignacion of asignaciones(); track asignacion.id) {
              <article class="asignacion-card">
                <div class="asignacion-card-heading">
                  <span class="estado-pill" [attr.data-estado]="asignacion.estado">
                    {{ estadoLabel(asignacion.estado) }}
                  </span>
                  <h3>{{ asignacion.alumno.displayName }}</h3>
                  <p class="asignacion-email">{{ asignacion.alumno.email }}</p>
                </div>

                <dl class="asignacion-details" aria-label="Datos de la asignacion">
                  <div>
                    <dt>Oferta</dt>
                    <dd>{{ asignacion.oferta.titulo }}</dd>
                  </div>
                  <div>
                    <dt>Empresa</dt>
                    <dd>{{ asignacion.empresa.nombre }}</dd>
                  </div>
                  <div>
                    <dt>Fecha</dt>
                    <dd>{{ formatFecha(asignacion.fechaAsignacion) }}</dd>
                  </div>
                  <div>
                    <dt>Solicitud</dt>
                    <dd>#{{ asignacion.solicitudId }}</dd>
                  </div>
                </dl>

                @if (asignacion.observaciones) {
                  <p class="asignacion-observaciones">{{ asignacion.observaciones }}</p>
                }
              </article>
            }
          </div>
        </section>
      }

      @if (asignacionesExternas().length > 0) {
        <section
          class="asignaciones-results external-results"
          aria-live="polite"
          aria-label="Asignaciones FCT externas"
        >
          <div class="results-heading">
            <p class="eyebrow">Asignaciones externas · Adzuna</p>
            <h2>{{ externalResultsTitle() }}</h2>
          </div>

          <div class="asignaciones-grid">
            @for (asignacion of asignacionesExternas(); track asignacion.id) {
              <article class="asignacion-card external-assignment-card">
                <div class="asignacion-card-heading">
                  <span class="estado-pill" [attr.data-estado]="asignacion.estado">
                    {{ estadoLabel(asignacion.estado) }}
                  </span>
                  <span class="external-marker">Adzuna</span>
                  <h3>{{ asignacion.alumnoNombre }}</h3>
                </div>

                <dl class="asignacion-details" aria-label="Datos de la asignacion externa">
                  <div>
                    <dt>Oferta</dt>
                    <dd>{{ asignacion.titulo }}</dd>
                  </div>
                  <div>
                    <dt>Empresa</dt>
                    <dd>{{ asignacion.empresaNombre || 'Empresa externa' }}</dd>
                  </div>
                  <div>
                    <dt>Fecha</dt>
                    <dd>{{ formatFecha(asignacion.fechaAsignacion) }}</dd>
                  </div>
                  <div>
                    <dt>Solicitud externa</dt>
                    <dd>#{{ asignacion.solicitudExternaId }}</dd>
                  </div>
                </dl>

                <a
                  class="external-link"
                  [href]="asignacion.urlAplicacion"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir oferta original
                </a>

                @if (asignacion.observaciones) {
                  <p class="asignacion-observaciones">{{ asignacion.observaciones }}</p>
                }
              </article>
            }
          </div>
        </section>
      }
    </main>
  `,
  styles: [
    `
      .asignaciones-page {
        align-content: start;
        gap: 1rem;
        padding-top: 2rem;
      }

      .create-panel,
      .state-panel {
        max-width: 46rem;
        padding: 1.2rem;
        border: 1px solid var(--line);
        border-radius: 0.5rem;
        background: var(--surface);
        box-shadow: var(--shadow-soft);
        backdrop-filter: blur(14px);
      }

      .create-panel form {
        display: grid;
        gap: 0.85rem;
        margin-top: 0.6rem;
      }

      .form-row {
        display: grid;
        gap: 0.35rem;
      }

      .form-row label {
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--ink);
      }

      .form-row input,
      .form-row textarea {
        padding: 0.55rem 0.7rem;
        border: 1px solid var(--line);
        border-radius: 0.4rem;
        font: inherit;
        background: rgba(255, 251, 245, 0.8);
      }

      .form-row textarea {
        resize: vertical;
      }

      .form-actions {
        display: flex;
        justify-content: flex-start;
      }

      .state-panel.alert {
        border-color: rgba(184, 79, 59, 0.28);
        background: rgba(255, 246, 241, 0.9);
      }

      .state-panel h2,
      .results-heading h2,
      .create-panel h2 {
        margin: 0;
        font-family: inherit;
        font-size: 1.45rem;
        line-height: 1.2;
      }

      .results-heading {
        display: grid;
        gap: 0.35rem;
      }

      .asignaciones-results {
        display: grid;
        gap: 1rem;
      }

      .asignaciones-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
        gap: 1rem;
      }

      .asignacion-card {
        display: grid;
        gap: 0.85rem;
        padding: 1rem;
        border: 1px solid var(--line);
        border-radius: 0.5rem;
        background: rgba(255, 251, 245, 0.72);
        box-shadow: var(--shadow-soft);
      }

      .external-create-panel,
      .external-assignment-card {
        border-color: rgba(199, 101, 59, 0.28);
        background: rgba(244, 236, 223, 0.72);
      }

      .asignacion-card-heading {
        display: grid;
        gap: 0.45rem;
      }

      .asignacion-card h3 {
        margin: 0;
        font-family: inherit;
        font-size: 1.15rem;
      }

      .asignacion-email {
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
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .estado-pill[data-estado='ACTIVA'] {
        background: rgba(46, 125, 50, 0.18);
        color: #1b5e20;
      }

      .estado-pill[data-estado='FINALIZADA'] {
        background: rgba(15, 118, 110, 0.18);
        color: #0b5f59;
      }

      .external-marker {
        justify-self: start;
        display: inline-flex;
        padding: 0.2rem 0.55rem;
        border-radius: 999px;
        background: rgba(199, 101, 59, 0.18);
        color: var(--accent-warm);
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .asignacion-details {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.65rem;
        margin: 0;
      }

      .asignacion-details dt {
        color: var(--muted);
        font-size: 0.78rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .asignacion-details dd {
        margin: 0.2rem 0 0;
        color: var(--ink);
        font-weight: 700;
        line-height: 1.35;
      }

      .asignacion-observaciones {
        margin: 0;
        color: var(--muted);
        font-style: italic;
        line-height: 1.5;
      }

      .external-link {
        justify-self: start;
        color: var(--accent);
        font-weight: 800;
        text-decoration: none;
      }

      .external-link:hover,
      .external-link:focus-visible {
        text-decoration: underline;
        outline: none;
      }

      .primary-action,
      .back-link {
        min-height: 2.5rem;
        display: inline-flex;
        align-items: center;
        padding: 0 0.85rem;
        border-radius: 0.5rem;
        font-weight: 800;
        text-decoration: none;
        cursor: pointer;
        font: inherit;
      }

      .primary-action {
        border: 0;
        color: #f7fbf8;
        background: var(--accent);
      }

      .primary-action:hover:not([disabled]),
      .primary-action:focus-visible:not([disabled]) {
        background: #0b5f59;
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
        background: rgba(255, 255, 255, 0.62);
      }

      .action-feedback {
        margin: 0;
        color: var(--muted);
        font-style: italic;
      }

      .muted {
        margin: 0.5rem 0 0;
        color: var(--muted);
        line-height: 1.55;
      }

      .form-row select {
        padding: 0.55rem 0.7rem;
        border: 1px solid var(--line);
        border-radius: 0.4rem;
        font: inherit;
        background: rgba(255, 251, 245, 0.8);
      }

      @media (max-width: 620px) {
        .asignaciones-page {
          padding-top: 1rem;
        }

        .asignacion-details {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsignacionesPage implements OnInit {
  private readonly asignacionesService = inject(AsignacionesService);
  private readonly asignacionesExternasService = inject(AsignacionesExternasService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly fb = inject(FormBuilder);

  protected readonly status = signal<ListStatus>('loading');
  protected readonly asignaciones = signal<AsignacionFct[]>([]);
  protected readonly candidatas = signal<AsignacionCandidata[]>([]);
  protected readonly candidatasStatus = signal<'loading' | 'loaded' | 'error'>('loading');
  protected readonly asignacionesExternas = signal<AsignacionFctExterna[]>([]);
  protected readonly candidatasExternas = signal<AsignacionExternaCandidata[]>([]);
  protected readonly candidatasExternasStatus = signal<'loading' | 'loaded' | 'error'>('loading');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly createMessage = signal<string | null>(null);
  protected readonly externalCreateMessage = signal<string | null>(null);
  protected readonly saveStatus = signal<SaveStatus>('idle');
  protected readonly saveExternalStatus = signal<SaveStatus>('idle');

  protected readonly form = this.fb.nonNullable.group({
    solicitudId: this.fb.nonNullable.control<number | null>(null, {
      validators: [Validators.required],
    }),
    observaciones: this.fb.nonNullable.control<string>(''),
  });

  protected readonly externalForm = this.fb.nonNullable.group({
    solicitudExternaId: this.fb.nonNullable.control<number | null>(null, {
      validators: [Validators.required],
    }),
    observaciones: this.fb.nonNullable.control<string>(''),
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.status.set('not-authenticated');
      return;
    }
    this.loadAsignaciones();
    this.loadCandidatas();
    this.loadAsignacionesExternas();
    this.loadCandidatasExternas();
  }

  protected estadoLabel(estado: AsignacionEstado): string {
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
    const count = this.asignaciones().length;
    return count === 1 ? '1 asignacion registrada' : `${count} asignaciones registradas`;
  }

  protected externalResultsTitle(): string {
    const count = this.asignacionesExternas().length;
    return count === 1
      ? '1 asignacion externa registrada'
      : `${count} asignaciones externas registradas`;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { solicitudId, observaciones } = this.form.getRawValue();
    if (solicitudId === null) {
      return;
    }

    const trimmed = (observaciones ?? '').trim();
    this.saveStatus.set('saving');
    this.createMessage.set(null);

    this.asignacionesService
      .create({ solicitudId, observaciones: trimmed.length === 0 ? undefined : trimmed })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (asignacion) => {
          this.asignaciones.update((current) => [asignacion, ...current]);
          this.candidatas.update((current) =>
            current.filter((item) => item.solicitudId !== asignacion.solicitudId),
          );
          this.status.set('loaded');
          this.createMessage.set('Asignacion creada correctamente.');
          this.saveStatus.set('idle');
          this.form.reset({ solicitudId: null, observaciones: '' });
        },
        error: (error: unknown) => {
          this.createMessage.set(createErrorMessage(error));
          this.saveStatus.set('idle');
        },
      });
  }

  protected submitExternal(): void {
    if (this.externalForm.invalid) {
      this.externalForm.markAllAsTouched();
      return;
    }
    const { solicitudExternaId, observaciones } = this.externalForm.getRawValue();
    if (solicitudExternaId === null) {
      return;
    }

    const trimmed = (observaciones ?? '').trim();
    this.saveExternalStatus.set('saving');
    this.externalCreateMessage.set(null);

    this.asignacionesExternasService
      .create({
        solicitudExternaId,
        observaciones: trimmed.length === 0 ? undefined : trimmed,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (asignacion) => {
          this.asignacionesExternas.update((current) => [asignacion, ...current]);
          this.candidatasExternas.update((current) =>
            current.filter((item) => item.solicitudExternaId !== asignacion.solicitudExternaId),
          );
          this.externalCreateMessage.set('Asignacion externa creada correctamente.');
          this.saveExternalStatus.set('idle');
          this.externalForm.reset({ solicitudExternaId: null, observaciones: '' });
        },
        error: (error: unknown) => {
          this.externalCreateMessage.set(createErrorMessage(error));
          this.saveExternalStatus.set('idle');
        },
      });
  }

  private loadCandidatas(): void {
    this.candidatasStatus.set('loading');
    this.asignacionesService
      .listCandidatas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (candidatas) => {
          this.candidatas.set(candidatas);
          this.candidatasStatus.set('loaded');
        },
        error: () => {
          this.candidatas.set([]);
          this.candidatasStatus.set('error');
        },
      });
  }

  private loadCandidatasExternas(): void {
    this.candidatasExternasStatus.set('loading');
    this.asignacionesExternasService
      .listCandidatas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (candidatas) => {
          this.candidatasExternas.set(candidatas);
          this.candidatasExternasStatus.set('loaded');
        },
        error: () => {
          this.candidatasExternas.set([]);
          this.candidatasExternasStatus.set('error');
        },
      });
  }

  private loadAsignaciones(): void {
    this.status.set('loading');
    this.errorMessage.set(null);

    this.asignacionesService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (asignaciones) => {
          this.asignaciones.set(asignaciones);
          this.status.set(asignaciones.length === 0 ? 'empty' : 'loaded');
        },
        error: (error: unknown) => {
          this.asignaciones.set([]);
          if (isUnauthorized(error)) {
            this.status.set('not-authenticated');
            return;
          }
          this.errorMessage.set(listErrorMessage(error));
          this.status.set('error');
        },
      });
  }

  private loadAsignacionesExternas(): void {
    this.asignacionesExternasService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (asignaciones) => {
          this.asignacionesExternas.set(asignaciones);
        },
        error: () => {
          this.asignacionesExternas.set([]);
        },
      });
  }
}

const ESTADO_LABELS: Record<AsignacionEstado, string> = {
  ACTIVA: 'Activa',
  FINALIZADA: 'Finalizada',
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
      return 'No tienes permisos para gestionar asignaciones.';
    }
  }
  return 'No se pudieron cargar las asignaciones. Intentalo de nuevo.';
}

function createErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 404) {
      return 'No se ha encontrado la solicitud indicada.';
    }
    if (error.status === 409) {
      return 'No se puede asignar: la solicitud no esta aceptada o ya tiene una asignacion.';
    }
    if (error.status === 403) {
      return 'No tienes permisos para crear asignaciones.';
    }
    if (error.status === 400) {
      return 'Revisa los datos del formulario antes de continuar.';
    }
  }
  return 'No se pudo crear la asignacion. Intentalo de nuevo.';
}
