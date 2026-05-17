import { NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { HomeCacheService } from '../home/home-cache.service';
import { OfertaModalidad } from '../practicas/ofertas.models';
import { CicloFormativoOption, GRADO_LABELS, GradoFp, getCiclosByFamilia } from '../practicas/ciclos-formativos';
import { PracticasCacheService } from '../practicas/practicas-cache.service';
import { FAMILIAS_PROFESIONALES, LOCALIDADES_ES } from '../practicas/practicas-options';
import { PreferenciasCacheService } from './preferencias-cache.service';
import { AlumnoPreferencias, AlumnoPreferenciasRequest } from './preferencias.models';
import { AlumnoPreferenciasService } from './preferencias.service';

type PageStatus = 'loading' | 'loaded' | 'error' | 'not-authenticated';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type UploadStatus = 'idle' | 'uploading' | 'saved' | 'error';

@Component({
  selector: 'app-preferencias-alumno-page',
  imports: [NgTemplateOutlet, ReactiveFormsModule, RouterLink],
  template: `
    @if (embedded) {
      <ng-container [ngTemplateOutlet]="bodyTpl"></ng-container>
    } @else {
      <main class="page-shell route-page preferencias-page">
        <ng-container [ngTemplateOutlet]="bodyTpl"></ng-container>
      </main>
    }

    <ng-template #bodyTpl>
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
      } @else if (editing()) {
        <section class="preferences-layout preferences-edit-layout" [class.is-profile-embedded]="!showPhoto">
          <form class="preferences-form" [formGroup]="form" (ngSubmit)="savePreferences()">
            @if (showPhoto) {
              <div class="section-heading">
                <p class="eyebrow">Preferencias</p>
                <h2>Datos básicos para orientar tus prácticas</h2>
              </div>
            }

            <div class="form-grid">
              <label>
                <span>Familia profesional</span>
                <select formControlName="familiaProfesional">
                  <option value="">Selecciona una familia</option>
                  @for (familia of familiaOptions; track familia.value) {
                    <option [value]="familia.value">{{ familia.label }}</option>
                  }
                </select>
              </label>

              <label>
                <span>Ciclo formativo</span>
                <select formControlName="cicloFormativo">
                  <option value="">
                    {{ cicloDisabled() ? 'Selecciona antes una familia' : 'Selecciona un ciclo' }}
                  </option>
                  @for (grupo of cicloGroups(); track grupo.grado) {
                    <optgroup [label]="grupo.label">
                      @for (ciclo of grupo.ciclos; track ciclo.value) {
                        <option [value]="ciclo.value">{{ ciclo.label }}</option>
                      }
                    </optgroup>
                  }
                </select>
              </label>

              <label>
                <span>Localidad o zona preferida</span>
                <select formControlName="localidadPreferida">
                  <option value="">Selecciona una localidad</option>
                  @for (localidad of localidadOptions; track localidad) {
                    <option [value]="localidad">{{ localidad }}</option>
                  }
                </select>
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

            @if (saveStatus() === 'error') {
              <p class="form-message error" role="alert">{{ saveError() }}</p>
            }

            @if (!showPhoto) {
              <input
                #embeddedPhotoInput
                class="visually-hidden-file"
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                (change)="onEmbeddedPhotoSelected($event)"
              />

              @if (photoUploadStatus() === 'saved') {
                <p class="form-message success" aria-live="polite">Foto actualizada.</p>
              } @else if (photoUploadStatus() === 'error') {
                <p class="form-message error" role="alert">{{ photoUploadError() }}</p>
              }
            }

            @if (showPhoto) {
              <section class="form-media-section" aria-label="Foto identificativa del alumno">
                <div class="photo-block">
                  <span class="profile-photo" [class.has-photo]="!!preferences()?.photoDataUrl">
                    @if (preferences()?.photoDataUrl) {
                      <img [src]="preferences()?.photoDataUrl" alt="Foto identificativa del alumno" />
                    } @else {
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4Zm0 2c-3.4 0-6.4 1.7-8 4.4.8 1 3.4 1.6 8 1.6s7.2-.6 8-1.6c-1.6-2.7-4.6-4.4-8-4.4Z" />
                      </svg>
                    }
                  </span>
                  <div class="photo-copy">
                    <strong>Foto identificativa</strong>
                    <span>{{ preferences()?.hasPhoto ? 'Foto asociada al perfil.' : 'Sin foto asociada.' }}</span>
                  </div>
                </div>

                <label class="file-control">
                  <span>Seleccionar imagen</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" (change)="onPhotoSelected($event)" />
                </label>

                @if (selectedPhoto()) {
                  <p class="muted">Imagen seleccionada: {{ selectedPhoto()?.name }}</p>
                }

                @if (photoUploadStatus() === 'saved') {
                  <p class="form-message success" aria-live="polite">Foto actualizada.</p>
                } @else if (photoUploadStatus() === 'error') {
                  <p class="form-message error" role="alert">{{ photoUploadError() }}</p>
                }

                <button
                  class="secondary-action"
                  type="button"
                  [disabled]="!selectedPhoto() || photoUploadStatus() === 'uploading'"
                  (click)="uploadPhoto()"
                >
                  {{ photoUploadStatus() === 'uploading' ? 'Subiendo...' : 'Subir foto' }}
                </button>
              </section>
            }

            <section class="form-cv-section" aria-label="CV del alumno">
              @if (showPhoto) {
                <div class="section-heading">
                  <p class="eyebrow">CV</p>
                  <h2>Currículum actualizado</h2>
                </div>
              }

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
            </section>

            <div class="form-actions">
              <button class="primary-action" type="submit" [disabled]="form.invalid || saveStatus() === 'saving'">
                {{ saveStatus() === 'saving' ? 'Guardando...' : 'Guardar preferencias' }}
              </button>
              <button class="secondary-action" type="button" (click)="cancelEdit()" [disabled]="saveStatus() === 'saving'">
                Cancelar
              </button>
            </div>
          </form>
        </section>
      } @else {
        <section class="preferences-layout" [class.is-profile-embedded]="!showPhoto">
          <article class="profile-view" aria-label="Preferencias guardadas">
            @if (showPhoto) {
              <div class="section-heading">
                <p class="eyebrow">Preferencias</p>
                <h2>Datos básicos para orientar tus prácticas</h2>
              </div>
            }

            <dl class="profile-view-grid">
              <div>
                <dt>Familia profesional</dt>
                <dd>{{ preferences()?.familiaProfesional || '—' }}</dd>
              </div>
              <div>
                <dt>Ciclo formativo</dt>
                <dd>{{ preferences()?.cicloFormativo || '—' }}</dd>
              </div>
              <div>
                <dt>Localidad o zona preferida</dt>
                <dd>{{ preferences()?.localidadPreferida || '—' }}</dd>
              </div>
              <div>
                <dt>Modalidad preferida</dt>
                <dd>{{ modalidadLabel(preferences()?.modalidadPreferida) }}</dd>
              </div>
              <div>
                <dt>Disponibilidad aproximada</dt>
                <dd>{{ formatStoredDate(preferences()?.fechaDisponibilidad) }}</dd>
              </div>
              <div>
                <dt>Correo del centro</dt>
                <dd>{{ centroEmail() || '—' }}</dd>
              </div>
              <div class="full-row">
                <dt>Observaciones</dt>
                <dd>{{ preferences()?.observaciones || '—' }}</dd>
              </div>
            </dl>

            @if (!showPhoto) {
              <section class="embedded-cv-panel" aria-label="CV del alumno">
                @if (preferences()?.hasCv) {
                  <div class="cv-status">
                    <strong>{{ preferences()?.cvFileName }}</strong>
                    <span>{{ cvSummary() }}</span>
                  </div>
                } @else {
                  <p class="muted">Aún no tienes un CV asociado a tu perfil.</p>
                }
              </section>
            }

            @if (saveStatus() === 'saved') {
              <p class="form-message success" aria-live="polite">Preferencias guardadas.</p>
            }

            <button class="primary-action" type="button" (click)="enterEdit()">
              Editar preferencias
            </button>
          </article>

          @if (showPhoto) {
            <aside class="cv-panel" aria-label="CV del alumno">
              <div class="photo-block">
                <span class="profile-photo" [class.has-photo]="!!preferences()?.photoDataUrl">
                  @if (preferences()?.photoDataUrl) {
                    <img [src]="preferences()?.photoDataUrl" alt="Foto identificativa del alumno" />
                  } @else {
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4Zm0 2c-3.4 0-6.4 1.7-8 4.4.8 1 3.4 1.6 8 1.6s7.2-.6 8-1.6c-1.6-2.7-4.6-4.4-8-4.4Z" />
                    </svg>
                  }
                </span>
                <div class="photo-copy">
                  <strong>Foto identificativa</strong>
                  <span>{{ preferences()?.hasPhoto ? 'Foto asociada al perfil.' : 'Sin foto asociada.' }}</span>
                </div>
              </div>

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
            </aside>
          }
        </section>
      }
    </ng-template>
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

      .preferences-layout.is-profile-embedded {
        grid-template-columns: 1fr;
        min-height: 0;
      }

      .preferences-edit-layout {
        grid-template-columns: 1fr;
      }

      .preferences-layout.is-profile-embedded .preferences-form {
        max-height: none;
        overflow: visible;
      }

      .preferences-form,
      .cv-panel,
      .profile-view,
      .state-panel {
        display: grid;
        gap: 1rem;
        padding: 1.25rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--surface);
        box-shadow: none;
      }

      .state-panel {
        max-width: 46rem;
      }

      .state-panel.alert {
        border-color: rgba(179, 38, 30, 0.32);
        background: var(--danger-soft);
      }

      .state-panel p:not(.eyebrow),
      .muted {
        margin: 0;
        color: var(--muted);
        line-height: 1.55;
        font-size: 0.95rem;
      }

      .section-heading {
        display: grid;
        gap: 0.3rem;
      }

      h2 {
        margin: 0;
        font-family: inherit;
        font-size: 1.25rem;
        line-height: 1.2;
        font-weight: 700;
        letter-spacing: -0.015em;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.8rem;
      }

      label,
      .file-control {
        display: grid;
        gap: 0.35rem;
        color: var(--ink);
        font-weight: 600;
        font-size: 0.88rem;
      }

      input,
      select,
      textarea {
        width: 100%;
        min-height: 2.55rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        padding: 0.55rem 0.75rem;
        color: var(--ink);
        background: var(--surface);
        font: inherit;
        font-size: 0.92rem;
        font-weight: 400;
        transition: border-color 140ms ease, box-shadow 140ms ease;
      }

      input:hover,
      select:hover,
      textarea:hover {
        border-color: var(--line-strong);
      }

      textarea {
        resize: vertical;
      }

      input:focus,
      select:focus,
      textarea:focus {
        border-color: var(--accent);
        outline: none;
        box-shadow: 0 0 0 3px rgba(17, 78, 74, 0.15);
      }

      .full-field {
        grid-column: 1 / -1;
      }

      .form-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .form-media-section,
      .form-cv-section {
        display: grid;
        gap: 0.8rem;
        padding-top: 0.1rem;
      }

      .profile-view {
        gap: 0.65rem;
        padding: 1rem;
      }

      .profile-view-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0;
        margin: 0;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        overflow: hidden;
      }

      .profile-view-grid div {
        padding: 0.7rem 0.85rem;
        background: var(--surface-muted);
        border-right: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
      }

      .profile-view-grid div:nth-child(2n) {
        border-right: 0;
      }

      .profile-view-grid .full-row {
        grid-column: 1 / -1;
        border-right: 0;
        border-bottom: 0;
      }

      .profile-view-grid dt {
        margin: 0;
        color: var(--muted);
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .profile-view-grid dd {
        margin: 0.25rem 0 0;
        color: var(--ink);
        font-weight: 600;
        line-height: 1.4;
        white-space: pre-wrap;
        font-size: 0.92rem;
      }

      .cv-status {
        display: grid;
        gap: 0.25rem;
        padding: 0.85rem;
        border: 1px solid rgba(17, 78, 74, 0.22);
        border-radius: var(--radius-md);
        background: var(--accent-soft);
      }

      .cv-status span {
        color: var(--muted);
        font-size: 0.9rem;
      }

      .embedded-cv-panel {
        display: grid;
        gap: 0.5rem;
        padding-top: 0.1rem;
      }

      .photo-block {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .profile-photo {
        width: 4rem;
        height: 4rem;
        border-radius: var(--radius-pill);
        background: var(--accent-soft);
        color: var(--accent);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        overflow: hidden;
      }

      .profile-photo img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .profile-photo svg {
        width: 2.4rem;
        height: 2.4rem;
        fill: currentColor;
      }

      .photo-copy {
        display: grid;
        gap: 0.2rem;
      }

      .photo-copy span {
        color: var(--muted);
        font-size: 0.88rem;
      }

      .primary-action,
      .secondary-action,
      .text-link {
        min-height: 2.5rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        justify-self: start;
        padding: 0 0.9rem;
        border-radius: var(--radius-md);
        border: 1px solid transparent;
        font-weight: 600;
        font-size: 0.9rem;
        text-decoration: none;
        cursor: pointer;
        transition: background-color 140ms ease, border-color 140ms ease;
      }

      .primary-action {
        color: #ffffff;
        background: var(--accent);
        border-color: var(--accent);
      }

      .primary-action:hover:not(:disabled),
      .primary-action:focus-visible:not(:disabled) {
        background: var(--accent-hover);
        border-color: var(--accent-hover);
      }

      .secondary-action,
      .text-link {
        color: var(--ink);
        background: var(--surface);
        border-color: var(--line-strong);
      }

      .secondary-action:hover,
      .text-link:hover {
        background: var(--surface-muted);
        border-color: var(--ink-soft);
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.58;
      }

      .visually-hidden-file {
        width: 1px;
        height: 1px;
        position: absolute;
        overflow: hidden;
        clip: rect(0 0 0 0);
        clip-path: inset(50%);
        white-space: nowrap;
      }

      .form-message {
        margin: 0;
        font-weight: 600;
        font-size: 0.9rem;
      }

      .form-message.success {
        color: var(--success);
      }

      .form-message.error {
        color: var(--danger);
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
  @Input() embedded = false;
  @Input() showPhoto = true;
  @Output() editingChange = new EventEmitter<boolean>();
  @Output() photoChange = new EventEmitter<string | null>();

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly preferenciasService = inject(AlumnoPreferenciasService);
  private readonly homeCache = inject(HomeCacheService);
  private readonly practicasCache = inject(PracticasCacheService);
  private readonly cache = inject(PreferenciasCacheService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly status = signal<PageStatus>('loading');
  protected readonly saveStatus = signal<SaveStatus>('idle');
  protected readonly uploadStatus = signal<UploadStatus>('idle');
  protected readonly photoUploadStatus = signal<UploadStatus>('idle');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly saveError = signal<string | null>(null);
  protected readonly uploadError = signal<string | null>(null);
  protected readonly photoUploadError = signal<string | null>(null);
  protected readonly preferences = signal<AlumnoPreferencias | null>(null);
  protected readonly centroEmail = computed(() => this.authService.currentUser()?.centroEmail ?? null);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly selectedPhoto = signal<File | null>(null);
  protected readonly editing = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    familiaProfesional: [''],
    cicloFormativo: [''],
    localidadPreferida: [''],
    modalidadPreferida: [''],
    fechaDisponibilidad: [''],
    observaciones: ['', [Validators.maxLength(1000)]],
  });

  protected readonly familiaOptions = FAMILIAS_PROFESIONALES;
  protected readonly localidadOptions = LOCALIDADES_ES;

  private readonly familiaValue = toSignal(this.form.controls.familiaProfesional.valueChanges, {
    initialValue: this.form.controls.familiaProfesional.value,
  });

  protected readonly cicloOptions = computed<CicloFormativoOption[]>(() =>
    getCiclosByFamilia(this.familiaValue()),
  );

  protected readonly cicloDisabled = computed(() => !this.familiaValue());

  protected readonly cicloGroups = computed<{ grado: GradoFp; label: string; ciclos: CicloFormativoOption[] }[]>(() => {
    const ciclos = this.cicloOptions();
    if (ciclos.length === 0) {
      return [];
    }
    const grados: GradoFp[] = ['GRADO_MEDIO', 'GRADO_SUPERIOR'];
    return grados
      .map((grado) => ({
        grado,
        label: GRADO_LABELS[grado],
        ciclos: ciclos.filter((c) => c.grado === grado),
      }))
      .filter((group) => group.ciclos.length > 0);
  });

  constructor() {
    this.form.controls.familiaProfesional.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((familia) => {
        const cicloActual = this.form.controls.cicloFormativo.value;
        if (!cicloActual) {
          return;
        }
        const ciclos = getCiclosByFamilia(familia);
        if (!ciclos.some((c) => c.value === cicloActual)) {
          this.form.controls.cicloFormativo.setValue('');
        }
      });

    effect(() => {
      const cicloControl = this.form.controls.cicloFormativo;
      if (this.cicloDisabled()) {
        if (cicloControl.enabled) {
          cicloControl.disable({ emitEvent: false });
        }
      } else if (cicloControl.disabled) {
        cicloControl.enable({ emitEvent: false });
      }
    });
  }

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

    const cached = this.cache.get();
    if (cached) {
      this.preferences.set(cached);
      this.patchFormFromPreferences();
      this.photoChange.emit(cached.photoDataUrl);
      this.status.set('loaded');
      return;
    }

    this.preferenciasService
      .getMine()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (preferences) => {
          this.cache.set(preferences);
          this.preferences.set(preferences);
          this.patchFormFromPreferences();
          this.photoChange.emit(preferences.photoDataUrl);
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
          this.cache.set(preferences);
          this.preferences.set(preferences);
          this.patchFormFromPreferences();
          this.photoChange.emit(preferences.photoDataUrl);
          this.saveStatus.set('saved');
          this.editing.set(false);
          this.editingChange.emit(false);
          this.homeCache.invalidate();
          this.practicasCache.invalidate();
        },
        error: (error: unknown) => {
          this.saveError.set(errorMessage(error));
          this.saveStatus.set('error');
        },
      });
  }

  protected enterEdit(): void {
    this.patchFormFromPreferences();
    this.saveStatus.set('idle');
    this.saveError.set(null);
    this.selectedFile.set(null);
    this.selectedPhoto.set(null);
    this.uploadStatus.set('idle');
    this.uploadError.set(null);
    this.photoUploadStatus.set('idle');
    this.photoUploadError.set(null);
    this.editing.set(true);
    this.editingChange.emit(true);
  }

  protected cancelEdit(): void {
    this.patchFormFromPreferences();
    this.saveStatus.set('idle');
    this.saveError.set(null);
    this.selectedFile.set(null);
    this.selectedPhoto.set(null);
    this.uploadStatus.set('idle');
    this.uploadError.set(null);
    this.photoUploadStatus.set('idle');
    this.photoUploadError.set(null);
    this.editing.set(false);
    this.editingChange.emit(false);
  }

  protected modalidadLabel(value: string | null | undefined): string {
    if (!value) {
      return 'Sin preferencia';
    }
    return MODALIDAD_LABELS[value] ?? value;
  }

  protected formatStoredDate(value: string | null | undefined): string {
    if (!value) {
      return '—';
    }
    return this.formatDate(value);
  }

  private patchFormFromPreferences(): void {
    const preferences = this.preferences();
    const sanitized = this.sanitizeCatalogFields(preferences);
    this.form.patchValue({
      familiaProfesional: sanitized.familiaProfesional,
      cicloFormativo: sanitized.cicloFormativo,
      localidadPreferida: sanitized.localidadPreferida,
      modalidadPreferida: preferences?.modalidadPreferida ?? '',
      fechaDisponibilidad: preferences?.fechaDisponibilidad ?? '',
      observaciones: preferences?.observaciones ?? '',
    });
  }

  private sanitizeCatalogFields(preferences: AlumnoPreferencias | null): {
    familiaProfesional: string;
    cicloFormativo: string;
    localidadPreferida: string;
  } {
    const familiaRaw = preferences?.familiaProfesional ?? '';
    const familiaProfesional = this.familiaOptions.some((f) => f.value === familiaRaw) ? familiaRaw : '';

    const cicloRaw = preferences?.cicloFormativo ?? '';
    const cicloFormativo = getCiclosByFamilia(familiaProfesional).some((c) => c.value === cicloRaw)
      ? cicloRaw
      : '';

    const localidadRaw = preferences?.localidadPreferida ?? '';
    const localidadPreferida = this.localidadOptions.includes(localidadRaw) ? localidadRaw : '';

    return { familiaProfesional, cicloFormativo, localidadPreferida };
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;
    this.selectedFile.set(file);
    this.uploadStatus.set('idle');
    this.uploadError.set(null);
  }

  protected onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;
    this.selectedPhoto.set(file);
    this.photoUploadStatus.set('idle');
    this.photoUploadError.set(null);
  }

  protected onEmbeddedPhotoSelected(event: Event): void {
    this.onPhotoSelected(event);
    this.uploadPhoto();
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
          this.cache.set(preferences);
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

  protected uploadPhoto(): void {
    const file = this.selectedPhoto();
    if (!file || this.photoUploadStatus() === 'uploading') {
      return;
    }

    this.photoUploadStatus.set('uploading');
    this.photoUploadError.set(null);

    this.preferenciasService
      .uploadPhoto(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (preferences) => {
          this.cache.set(preferences);
          this.preferences.set(preferences);
          this.selectedPhoto.set(null);
          this.photoUploadStatus.set('saved');
          this.photoChange.emit(preferences.photoDataUrl);
        },
        error: (error: unknown) => {
          this.photoUploadError.set(errorMessage(error));
          this.photoUploadStatus.set('error');
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

const MODALIDAD_LABELS: Record<string, string> = {
  PRESENCIAL: 'Presencial',
  HIBRIDA: 'Híbrida',
  REMOTA: 'Remota',
};

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
    return 'Revisa los datos enviados. El CV o la foto no tienen un formato válido o superan el tamaño permitido.';
  }

    return 'No se pudo completar la operación. Inténtalo de nuevo.';
}
