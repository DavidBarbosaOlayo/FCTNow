import { NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Input,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { FAMILIAS_PROFESIONALES, LOCALIDADES_ES } from '../practicas/practicas-options';
import { EmpresaPerfil, EmpresaPerfilRequest, EmpresaEstado } from './empresa-perfil.models';
import { EmpresaPerfilService } from './empresa-perfil.service';

type PageStatus = 'loading' | 'loaded' | 'error' | 'not-authenticated';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

@Component({
  selector: 'app-empresa-perfil-page',
  imports: [NgTemplateOutlet, ReactiveFormsModule, RouterLink],
  template: `
    @if (embedded) {
      <ng-container [ngTemplateOutlet]="bodyTpl"></ng-container>
    } @else {
      <main class="page-shell route-page empresa-perfil-page">
        <ng-container [ngTemplateOutlet]="bodyTpl"></ng-container>
      </main>
    }

    <ng-template #bodyTpl>
      @if (status() === 'loading') {
        <section class="state-panel" aria-live="polite">
          <p class="eyebrow">Cargando</p>
          <h2>Recuperando la ficha de empresa</h2>
          <p>Estamos consultando los datos vinculados a tu usuario.</p>
        </section>
      } @else if (status() === 'not-authenticated') {
        <section class="state-panel alert" role="alert">
          <p class="eyebrow">Sesión no disponible</p>
          <h2>Inicia sesión como empresa</h2>
          <p>Necesitas una sesión activa de empresa para editar esta ficha.</p>
          <a class="text-link" routerLink="/login">Ir al acceso</a>
        </section>
      } @else if (status() === 'error') {
        <section class="state-panel alert" role="alert">
          <p class="eyebrow">Error</p>
          <h2>No se pudo cargar tu perfil de empresa</h2>
          <p>{{ errorMessage() }}</p>
        </section>
      } @else if (editing()) {
        <form class="profile-form" [formGroup]="form" (ngSubmit)="save()">
          <div class="section-heading">
            <p class="eyebrow">Ficha vinculada</p>
            <h2>{{ empresa()?.nombre }}</h2>
            <p>Estado actual: {{ estadoLabel(empresa()?.estado) }}</p>
          </div>

          <div class="form-grid">
            <label>
              <span>Nombre</span>
              <input formControlName="nombre" maxlength="150" />
            </label>

            <label>
              <span>Tipo de identificador</span>
              <select formControlName="tipoIdentificadorFiscal">
                <option value="CIF">CIF</option>
                <option value="NIF">NIF</option>
                <option value="NIE">NIE</option>
              </select>
            </label>

            <label>
              <span>Identificador fiscal</span>
              <input formControlName="identificadorFiscal" maxlength="20" />
            </label>

            <label>
              <span>Sector</span>
              <select formControlName="sector">
                <option value="">Selecciona un sector</option>
                @for (familia of sectorOptions; track familia.value) {
                  <option [value]="familia.value">{{ familia.label }}</option>
                }
              </select>
            </label>

            <label>
              <span>Dirección</span>
              <input formControlName="direccion" maxlength="200" />
            </label>

            <label>
              <span>Localidad</span>
              <select formControlName="localidad">
                <option value="">Selecciona una localidad</option>
                @for (localidad of localidadOptions; track localidad) {
                  <option [value]="localidad">{{ localidad }}</option>
                }
              </select>
            </label>

            <label>
              <span>Provincia</span>
              <input formControlName="provincia" maxlength="100" />
            </label>

            <label>
              <span>Código postal</span>
              <input formControlName="codigoPostal" maxlength="5" inputmode="numeric" />
            </label>

            <label>
              <span>Email de contacto</span>
              <input type="email" formControlName="emailContacto" maxlength="254" />
            </label>

            <label>
              <span>Teléfono de contacto</span>
              <input formControlName="telefonoContacto" maxlength="30" />
            </label>

            <label>
              <span>Persona de contacto</span>
              <input formControlName="personaContacto" maxlength="150" />
            </label>
          </div>

          <label class="full-field">
            <span>Descripción breve</span>
            <textarea formControlName="descripcion" maxlength="1000" rows="5"></textarea>
          </label>

          @if (form.invalid && form.touched) {
            <p class="form-message error" role="alert">
              Revisa los campos obligatorios, el email y el código postal antes de guardar.
            </p>
          }

          @if (saveStatus() === 'error') {
            <p class="form-message error" role="alert">{{ saveError() }}</p>
          }

          <div class="form-actions">
            <button class="primary-action" type="submit" [disabled]="form.invalid || saveStatus() === 'saving'">
              {{ saveStatus() === 'saving' ? 'Guardando...' : 'Guardar perfil' }}
            </button>
            <button class="secondary-action" type="button" (click)="cancelEdit()" [disabled]="saveStatus() === 'saving'">
              Cancelar
            </button>
          </div>
        </form>
      } @else {
        <article class="profile-view" aria-label="Perfil de empresa guardado">
          <div class="section-heading">
            <p class="eyebrow">Ficha vinculada</p>
            <h2>{{ empresa()?.nombre || '—' }}</h2>
            <p>Estado actual: {{ estadoLabel(empresa()?.estado) }}</p>
          </div>

          <dl class="profile-view-grid">
            <div>
              <dt>Nombre</dt>
              <dd>{{ empresa()?.nombre || '—' }}</dd>
            </div>
            <div>
              <dt>Tipo de identificador</dt>
              <dd>{{ empresa()?.tipoIdentificadorFiscal || '—' }}</dd>
            </div>
            <div>
              <dt>Identificador fiscal</dt>
              <dd>{{ empresa()?.identificadorFiscal || '—' }}</dd>
            </div>
            <div>
              <dt>Sector</dt>
              <dd>{{ empresa()?.sector || '—' }}</dd>
            </div>
            <div>
              <dt>Dirección</dt>
              <dd>{{ empresa()?.direccion || '—' }}</dd>
            </div>
            <div>
              <dt>Localidad</dt>
              <dd>{{ empresa()?.localidad || '—' }}</dd>
            </div>
            <div>
              <dt>Provincia</dt>
              <dd>{{ empresa()?.provincia || '—' }}</dd>
            </div>
            <div>
              <dt>Código postal</dt>
              <dd>{{ empresa()?.codigoPostal || '—' }}</dd>
            </div>
            <div>
              <dt>Email de contacto</dt>
              <dd>{{ empresa()?.emailContacto || '—' }}</dd>
            </div>
            <div>
              <dt>Teléfono de contacto</dt>
              <dd>{{ empresa()?.telefonoContacto || '—' }}</dd>
            </div>
            <div>
              <dt>Persona de contacto</dt>
              <dd>{{ empresa()?.personaContacto || '—' }}</dd>
            </div>
            <div class="full-row">
              <dt>Descripción breve</dt>
              <dd>{{ empresa()?.descripcion || '—' }}</dd>
            </div>
          </dl>

          @if (saveStatus() === 'saved') {
            <p class="form-message success" aria-live="polite">Perfil de empresa guardado.</p>
          }

          <button class="primary-action" type="button" (click)="enterEdit()">
            Editar perfil
          </button>
        </article>
      }
    </ng-template>
  `,
  styles: [
    `
      .empresa-perfil-page {
        align-content: start;
        gap: 1rem;
        padding-top: 2rem;
      }

      .profile-form,
      .profile-view,
      .state-panel {
        display: grid;
        gap: 1rem;
        padding: 1.2rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--surface);
        box-shadow: var(--shadow-soft);
      }

      .state-panel {
        max-width: 46rem;
      }

      .state-panel.alert {
        border-color: rgba(179, 38, 30, 0.28);
        background: rgba(255, 246, 241, 0.9);
      }

      .state-panel p:not(.eyebrow),
      .section-heading p:not(.eyebrow) {
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

      label {
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
        border-radius: var(--radius-md);
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
        border-color: rgba(17, 78, 74, 0.5);
        outline: none;
        box-shadow: 0 0 0 3px rgba(17, 78, 74, 0.12);
      }

      .full-field {
        grid-column: 1 / -1;
      }

      .primary-action,
      .text-link {
        min-height: 2.7rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        justify-self: start;
        padding: 0 0.9rem;
        border-radius: var(--radius-md);
        border: 1px solid transparent;
        font-weight: 800;
        text-decoration: none;
      }

      .primary-action {
        color: #ffffff;
        background: var(--accent);
      }

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
        color: var(--accent);
      }

      .form-message.error {
        color: var(--danger);
      }

      .form-actions {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
      }

      .profile-view {
        gap: 0.85rem;
      }

      .profile-view-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
        margin: 0;
      }

      .profile-view-grid div {
        padding: 0.75rem 0.85rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: rgba(255, 255, 255, 0.55);
      }

      .profile-view-grid .full-row {
        grid-column: 1 / -1;
      }

      .profile-view-grid dt {
        margin: 0;
        color: var(--muted);
        font-size: 0.78rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .profile-view-grid dd {
        margin: 0.3rem 0 0;
        color: var(--ink);
        font-weight: 700;
        line-height: 1.45;
        white-space: pre-wrap;
      }

      @media (max-width: 760px) {
        .form-grid,
        .profile-view-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresaPerfilPage implements OnInit {
  @Input() embedded = false;

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly empresaPerfilService = inject(EmpresaPerfilService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly status = signal<PageStatus>('loading');
  protected readonly saveStatus = signal<SaveStatus>('idle');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly saveError = signal<string | null>(null);
  protected readonly empresa = signal<EmpresaPerfil | null>(null);
  protected readonly editing = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    tipoIdentificadorFiscal: ['CIF', [Validators.required]],
    identificadorFiscal: ['', [Validators.required, Validators.maxLength(20)]],
    sector: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: ['', [Validators.maxLength(1000)]],
    direccion: ['', [Validators.required, Validators.maxLength(200)]],
    localidad: ['', [Validators.required, Validators.maxLength(100)]],
    provincia: ['', [Validators.required, Validators.maxLength(100)]],
    codigoPostal: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
    emailContacto: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    telefonoContacto: ['', [Validators.maxLength(30)]],
    personaContacto: ['', [Validators.required, Validators.maxLength(150)]],
  });

  protected readonly sectorOptions = FAMILIAS_PROFESIONALES;
  protected readonly localidadOptions = LOCALIDADES_ES;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.authService.accessToken()) {
      this.status.set('not-authenticated');
      return;
    }

    this.empresaPerfilService
      .getMine()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (empresa) => {
          this.empresa.set(empresa);
          this.form.patchValue({
            nombre: empresa.nombre,
            tipoIdentificadorFiscal: empresa.tipoIdentificadorFiscal,
            identificadorFiscal: empresa.identificadorFiscal,
            sector: this.sanitizeSector(empresa.sector),
            descripcion: empresa.descripcion ?? '',
            direccion: empresa.direccion,
            localidad: this.sanitizeLocalidad(empresa.localidad),
            provincia: empresa.provincia,
            codigoPostal: empresa.codigoPostal,
            emailContacto: empresa.emailContacto,
            telefonoContacto: empresa.telefonoContacto ?? '',
            personaContacto: empresa.personaContacto,
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

  protected save(): void {
    if (this.form.invalid || this.saveStatus() === 'saving') {
      this.form.markAllAsTouched();
      return;
    }

    this.saveStatus.set('saving');
    this.saveError.set(null);

    this.empresaPerfilService
      .updateMine(this.formRequest())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (empresa) => {
          this.empresa.set(empresa);
          this.patchFormFromEmpresa();
          this.saveStatus.set('saved');
          this.editing.set(false);
        },
        error: (error: unknown) => {
          this.saveError.set(errorMessage(error));
          this.saveStatus.set('error');
        },
      });
  }

  protected enterEdit(): void {
    this.patchFormFromEmpresa();
    this.saveStatus.set('idle');
    this.saveError.set(null);
    this.editing.set(true);
  }

  protected cancelEdit(): void {
    this.patchFormFromEmpresa();
    this.saveStatus.set('idle');
    this.saveError.set(null);
    this.editing.set(false);
  }

  private patchFormFromEmpresa(): void {
    const empresa = this.empresa();
    if (!empresa) {
      return;
    }
    this.form.patchValue({
      nombre: empresa.nombre,
      tipoIdentificadorFiscal: empresa.tipoIdentificadorFiscal,
      identificadorFiscal: empresa.identificadorFiscal,
      sector: this.sanitizeSector(empresa.sector),
      descripcion: empresa.descripcion ?? '',
      direccion: empresa.direccion,
      localidad: this.sanitizeLocalidad(empresa.localidad),
      provincia: empresa.provincia,
      codigoPostal: empresa.codigoPostal,
      emailContacto: empresa.emailContacto,
      telefonoContacto: empresa.telefonoContacto ?? '',
      personaContacto: empresa.personaContacto,
    });
  }

  private sanitizeSector(value: string | null | undefined): string {
    return this.sectorOptions.some((f) => f.value === value) ? (value as string) : '';
  }

  private sanitizeLocalidad(value: string | null | undefined): string {
    return value && this.localidadOptions.includes(value) ? value : '';
  }

  protected estadoLabel(estado: EmpresaEstado | undefined): string {
    if (!estado) {
      return 'No disponible';
    }
    return ESTADO_LABELS[estado] ?? estado;
  }

  private formRequest(): EmpresaPerfilRequest {
    const value = this.form.getRawValue();
    return {
      nombre: value.nombre.trim(),
      tipoIdentificadorFiscal: value.tipoIdentificadorFiscal as EmpresaPerfilRequest['tipoIdentificadorFiscal'],
      identificadorFiscal: value.identificadorFiscal.trim(),
      sector: value.sector.trim(),
      descripcion: nullable(value.descripcion),
      direccion: value.direccion.trim(),
      localidad: value.localidad.trim(),
      provincia: value.provincia.trim(),
      codigoPostal: value.codigoPostal.trim(),
      emailContacto: value.emailContacto.trim(),
      telefonoContacto: nullable(value.telefonoContacto),
      personaContacto: value.personaContacto.trim(),
    };
  }
}

const ESTADO_LABELS: Record<EmpresaEstado, string> = {
  ACTIVA: 'Activa',
  INACTIVA: 'Inactiva',
  PENDIENTE_REVISION: 'Pendiente de revisión',
  RECHAZADA: 'Rechazada',
};

function nullable(value: string): string | null {
  return value.trim() === '' ? null : value.trim();
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 401;
}

function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No se pudo contactar con el servidor. Comprueba que el backend esté disponible.';
    }
    if (error.status === 400) {
      return 'Revisa los datos enviados antes de guardar.';
    }
    if (error.status === 403) {
      return 'No tienes una empresa vinculada o no tienes permisos para editar esta ficha.';
    }
    if (error.status === 409) {
      return 'Ya existe una empresa con ese identificador fiscal.';
    }
  }
  return 'No se pudo completar la operación. Inténtalo de nuevo.';
}
