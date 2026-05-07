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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { OfertaModalidad } from '../practicas/ofertas.models';
import { AlumnoPreferencias, AlumnoPreferenciasRequest } from './preferencias.models';
import { AlumnoPreferenciasService } from './preferencias.service';

type PageStatus = 'loading' | 'loaded' | 'error' | 'not-authenticated';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type UploadStatus = 'idle' | 'uploading' | 'saved' | 'error';

@Component({
  selector: 'app-preferencias-alumno-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="page-shell route-page preferencias-page">
      <header class="route-hero">
        <p class="eyebrow">Alumno</p>
        <h1>Preferencias y CV</h1>
        <p>
          Completa tus preferencias básicas de prácticas FCT y adjunta tu CV actualizado.
        </p>
      </header>

      @if (status() === 'loading') {
        <section class="state-panel" aria-live="polite">
          <p class="eyebrow">Cargando</p>
          <h2>Recuperando tus preferencias</h2>
          <p>Estamos preparando el formulario con la información disponible.</p>
        </section>
      } @else if (status() === 'not-authenticated') {
        <section class="state-panel alert" role="alert">
          <p class="eyebrow">Sesión no disponible</p>
          <h2>Inicia sesión para editar tus preferencias</h2>
          <p>Necesitas una sesión activa de alumno para gestionar tus datos FCT.</p>
          <a class="text-link" routerLink="/login">Ir al acceso</a>
        </section>
      } @else if (status() === 'error') {
        <section class="state-panel alert" role="alert">
          <p class="eyebrow">Error</p>
          <h2>No se pudieron cargar tus preferencias</h2>
          <p>{{ errorMessage() }}</p>
        </section>
      } @else {
        <section class="preferences-layout">
          <form class="preferences-form" [formGroup]="form" (ngSubmit)="savePreferences()">
            <div class="section-heading">
              <p class="eyebrow">Preferencias</p>
              <h2>Datos básicos para orientar tus prácticas</h2>
            </div>

            <div class="form-grid">
              <label>
                <span>Familia profesional</span>
                <input formControlName="familiaProfesional" maxlength="150" />
              </label>

              <label>
                <span>Ciclo formativo</span>
                <input formControlName="cicloFormativo" maxlength="150" />
              </label>

              <label>
                <span>Localidad o zona preferida</span>
                <input formControlName="localidadPreferida" maxlength="150" />
              </label>

              <label>
                <span>Modalidad preferida</span>
                <select formControlName="modalidadPreferida">
                  <option value="">Sin preferencia</option>
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="HIBRIDA">Híbrida</option>
                  <option value="REMOTA">Remota</option>
                </select>
              </label>

              <label>
                <span>Disponibilidad aproximada</span>
                <input type="date" formControlName="fechaDisponibilidad" />
              </label>
            </div>

            <label class="full-field">
              <span>Observaciones</span>
              <textarea formControlName="observaciones" maxlength="1000" rows="5"></textarea>
            </label>

            @if (form.invalid && form.touched) {
              <p class="form-message error" role="alert">
                Revisa la longitud de los campos antes de guardar.
              </p>
            }

            @if (saveStatus() === 'saved') {
              <p class="form-message success" aria-live="polite">Preferencias guardadas.</p>
            } @else if (saveStatus() === 'error') {
              <p class="form-message error" role="alert">{{ saveError() }}</p>
            }

            <button class="primary-action" type="submit" [disabled]="form.invalid || saveStatus() === 'saving'">
              {{ saveStatus() === 'saving' ? 'Guardando...' : 'Guardar preferencias' }}
            </button>
          </form>

          <aside class="cv-panel" aria-label="CV del alumno">
            <div class="section-heading">
              <p class="eyebrow">CV</p>
              <h2>Currículum actualizado</h2>
            </div>

            @if (preferences()?.hasCv) {
              <div class="cv-status">
                <strong>{{ preferences()?.cvFileName }}</strong>
                <span>{{ cvSummary() }}</span>
              </div>
            } @else {
              <p class="muted">Aún no tienes un CV asociado a tu perfil.</p>
            }

            <label class="file-control">
              <span>Seleccionar PDF</span>
              <input type="file" accept="application/pdf,.pdf" (change)="onFileSelected($event)" />
            </label>

            @if (selectedFile()) {
              <p class="muted">Archivo seleccionado: {{ selectedFile()?.name }}</p>
            }

            @if (uploadStatus() === 'saved') {
              <p class="form-message success" aria-live="polite">CV actualizado.</p>
            } @else if (uploadStatus() === 'error') {
              <p class="form-message error" role="alert">{{ uploadError() }}</p>
            }

            <button
              class="secondary-action"
              type="button"
              [disabled]="!selectedFile() || uploadStatus() === 'uploading'"
              (click)="uploadCv()"
            >
              {{ uploadStatus() === 'uploading' ? 'Subiendo...' : 'Subir CV' }}
            </button>
          </aside>
        </section>
      }
    </main>
  `,
  styles: [
    `
      .preferencias-page {
        align-content: start;
        gap: 1rem;
        padding-top: 2rem;
      }

      .preferences-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(18rem, 24rem);
        gap: 1rem;
        align-items: start;
      }

      .preferences-form,
      .cv-panel,
      .state-panel {
        display: grid;
        gap: 1rem;
        padding: 1.2rem;
        border: 1px solid var(--line);
        border-radius: 0.5rem;
        background: var(--surface);
        box-shadow: var(--shadow-soft);
      }

      .state-panel {
        max-width: 46rem;
      }

      .state-panel.alert {
        border-color: rgba(184, 79, 59, 0.28);
        background: rgba(255, 246, 241, 0.9);
      }

      .state-panel p:not(.eyebrow),
      .muted {
        margin: 0;
        color: var(--muted);
        line-height: 1.6;
      }

      .section-heading {
        display: grid;
        gap: 0.35rem;
      }

      h2 {
        margin: 0;
        font-family: inherit;
        font-size: 1.35rem;
        line-height: 1.2;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.85rem;
      }

      label,
      .file-control {
        display: grid;
        gap: 0.4rem;
        color: var(--ink);
        font-weight: 800;
      }

      input,
      select,
      textarea {
        width: 100%;
        min-height: 2.7rem;
        border: 1px solid var(--line);
        border-radius: 0.5rem;
        padding: 0.65rem 0.75rem;
        color: var(--ink);
        background: rgba(255, 255, 255, 0.74);
        font: inherit;
      }

      textarea {
        resize: vertical;
      }

      input:focus,
      select:focus,
      textarea:focus {
        border-color: rgba(15, 118, 110, 0.5);
        outline: none;
        box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
      }

      .full-field {
        grid-column: 1 / -1;
      }

      .cv-status {
        display: grid;
        gap: 0.25rem;
        padding: 0.85rem;
        border: 1px solid rgba(15, 118, 110, 0.2);
        border-radius: 0.5rem;
        background: rgba(15, 118, 110, 0.08);
      }

      .cv-status span {
        color: var(--muted);
        font-size: 0.92rem;
      }

      .primary-action,
      .secondary-action,
      .text-link {
        min-height: 2.7rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        justify-self: start;
        padding: 0 0.9rem;
        border-radius: 0.5rem;
        border: 1px solid transparent;
        font-weight: 800;
        text-decoration: none;
      }

      .primary-action {
        color: #f7fbf8;
        background: var(--accent);
      }

      .secondary-action,
      .text-link {
        color: var(--ink);
        background: rgba(255, 255, 255, 0.68);
        border-color: var(--line);
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.58;
      }

      .form-message {
        margin: 0;
        font-weight: 800;
      }

      .form-message.success {
        color: #0f766e;
      }

      .form-message.error {
        color: #a13d2d;
      }

      @media (max-width: 820px) {
        .preferences-layout,
        .form-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreferenciasAlumnoPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly preferenciasService = inject(AlumnoPreferenciasService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly status = signal<PageStatus>('loading');
  protected readonly saveStatus = signal<SaveStatus>('idle');
  protected readonly uploadStatus = signal<UploadStatus>('idle');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly saveError = signal<string | null>(null);
  protected readonly uploadError = signal<string | null>(null);
  protected readonly preferences = signal<AlumnoPreferencias | null>(null);
  protected readonly selectedFile = signal<File | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    familiaProfesional: ['', [Validators.maxLength(150)]],
    cicloFormativo: ['', [Validators.maxLength(150)]],
    localidadPreferida: ['', [Validators.maxLength(150)]],
    modalidadPreferida: [''],
    fechaDisponibilidad: [''],
    observaciones: ['', [Validators.maxLength(1000)]],
  });

  protected readonly cvSummary = computed(() => {
    const preferences = this.preferences();
    if (!preferences?.hasCv) {
      return 'Sin CV asociado';
    }

    const size = preferences.cvSize ? `${Math.round(preferences.cvSize / 1024)} KB` : 'tamaño no disponible';
    return preferences.cvUpdatedAt ? `${size} · actualizado el ${this.formatDate(preferences.cvUpdatedAt)}` : size;
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.authService.accessToken()) {
      this.status.set('not-authenticated');
      return;
    }

    this.preferenciasService
      .getMine()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (preferences) => {
          this.preferences.set(preferences);
          this.form.patchValue({
            familiaProfesional: preferences.familiaProfesional ?? '',
            cicloFormativo: preferences.cicloFormativo ?? '',
            localidadPreferida: preferences.localidadPreferida ?? '',
            modalidadPreferida: preferences.modalidadPreferida ?? '',
            fechaDisponibilidad: preferences.fechaDisponibilidad ?? '',
            observaciones: preferences.observaciones ?? '',
          });
          this.status.set('loaded');
        },
        error: (error: unknown) => {
          if (isUnauthorized(error)) {
            this.status.set('not-authenticated');
            return;
          }

          this.errorMessage.set(errorMessage(error));
          this.status.set('error');
        },
      });
  }

  protected savePreferences(): void {
    if (this.form.invalid || this.saveStatus() === 'saving') {
      this.form.markAllAsTouched();
      return;
    }

    this.saveStatus.set('saving');
    this.saveError.set(null);

    this.preferenciasService
      .updateMine(this.formRequest())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (preferences) => {
          this.preferences.set(preferences);
          this.saveStatus.set('saved');
        },
        error: (error: unknown) => {
          this.saveError.set(errorMessage(error));
          this.saveStatus.set('error');
        },
      });
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;
    this.selectedFile.set(file);
    this.uploadStatus.set('idle');
    this.uploadError.set(null);
  }

  protected uploadCv(): void {
    const file = this.selectedFile();
    if (!file || this.uploadStatus() === 'uploading') {
      return;
    }

    this.uploadStatus.set('uploading');
    this.uploadError.set(null);

    this.preferenciasService
      .uploadCv(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (preferences) => {
          this.preferences.set(preferences);
          this.selectedFile.set(null);
          this.uploadStatus.set('saved');
        },
        error: (error: unknown) => {
          this.uploadError.set(errorMessage(error));
          this.uploadStatus.set('error');
        },
      });
  }

  private formRequest(): AlumnoPreferenciasRequest {
    const value = this.form.getRawValue();
    return {
      familiaProfesional: nullable(value.familiaProfesional),
      cicloFormativo: nullable(value.cicloFormativo),
      localidadPreferida: nullable(value.localidadPreferida),
      modalidadPreferida: value.modalidadPreferida === '' ? null : value.modalidadPreferida as OfertaModalidad,
      fechaDisponibilidad: nullable(value.fechaDisponibilidad),
      observaciones: nullable(value.observaciones),
    };
  }

  private formatDate(value: string): string {
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
}

function nullable(value: string): string | null {
  return value.trim() === '' ? null : value.trim();
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 401;
}

function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 0) {
    return 'No se pudo contactar con el servidor. Comprueba que el backend esté disponible.';
  }

  if (error instanceof HttpErrorResponse && error.status === 400) {
    return 'Revisa los datos enviados. El CV debe ser un PDF válido y no superar el tamaño permitido.';
  }

  return 'No se pudo completar la operación. Inténtalo de nuevo.';
}
