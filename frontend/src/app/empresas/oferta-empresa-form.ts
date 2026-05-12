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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OfertaModalidad } from '../practicas/ofertas.models';
import { EmpresaOfertasService } from './empresa-ofertas.service';
import { OfertaFctRequest } from './empresa-ofertas.models';

type FormStatus = 'loading' | 'ready' | 'saving' | 'error' | 'not-authenticated' | 'not-found';

type ModalidadOption = {
  value: OfertaModalidad;
  label: string;
};

@Component({
  selector: 'app-oferta-empresa-form-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="page-shell route-page form-page">
      @if (status() === 'loading') {
        <section class="state-panel" aria-live="polite">
          <p class="eyebrow">Cargando</p>
          <h2>Recuperando la oferta</h2>
        </section>
      } @else if (status() === 'not-authenticated') {
        <section class="state-panel alert" role="alert">
          <p class="eyebrow">Sesion no disponible</p>
          <h2>Inicia sesion para gestionar ofertas</h2>
          <a class="back-link" routerLink="/login">Ir al acceso</a>
        </section>
      } @else if (status() === 'not-found') {
        <section class="state-panel alert" role="alert">
          <p class="eyebrow">No encontrada</p>
          <h2>La oferta no existe o no pertenece a tu empresa</h2>
          <a class="back-link" routerLink="/empresa/ofertas">Volver al listado</a>
        </section>
      } @else {
        <form class="oferta-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="form-grid">
            <label class="field wide">
              <span>Titulo *</span>
              <input type="text" formControlName="titulo" maxlength="150" required />
            </label>

            <label class="field wide">
              <span>Descripcion *</span>
              <textarea formControlName="descripcion" rows="3" maxlength="2000" required></textarea>
            </label>

            <label class="field">
              <span>Familia profesional *</span>
              <input type="text" formControlName="familiaProfesional" maxlength="150" required />
            </label>

            <label class="field">
              <span>Ciclo formativo</span>
              <input type="text" formControlName="cicloFormativo" maxlength="150" />
            </label>

            <label class="field">
              <span>Localidad *</span>
              <input type="text" formControlName="localidad" maxlength="100" required />
            </label>

            <label class="field">
              <span>Provincia *</span>
              <input type="text" formControlName="provincia" maxlength="100" required />
            </label>

            <label class="field">
              <span>Modalidad *</span>
              <select formControlName="modalidad" required>
                @for (option of modalidadOptions; track option.value) {
                  <option [value]="option.value">{{ option.label }}</option>
                }
              </select>
            </label>

            <label class="field">
              <span>Plazas *</span>
              <input type="number" min="1" formControlName="plazas" required />
            </label>

            <label class="field">
              <span>Fecha de inicio *</span>
              <input type="date" formControlName="fechaInicio" required />
            </label>

            <label class="field">
              <span>Fecha de fin *</span>
              <input type="date" formControlName="fechaFin" required />
            </label>

            <label class="field wide">
              <span>Tareas *</span>
              <textarea formControlName="tareas" rows="3" maxlength="2000" required></textarea>
            </label>

            <label class="field wide">
              <span>Requisitos</span>
              <textarea formControlName="requisitos" rows="2" maxlength="2000"></textarea>
            </label>
          </div>

          @if (errorMessage(); as msg) {
            <p class="form-error" role="alert">{{ msg }}</p>
          }

          <div class="form-actions">
            <button class="primary-action" type="submit" [disabled]="status() === 'saving'">
              {{ isEditMode() ? 'Guardar cambios' : 'Crear oferta' }}
            </button>
            <a class="secondary-action" routerLink="/empresa/ofertas">Cancelar</a>
          </div>
        </form>
      }
    </main>
  `,
  styles: [
    `
      .form-page {
        align-content: start;
        gap: 1rem;
        padding-top: 2rem;
      }

      .oferta-form {
        display: grid;
        gap: 1rem;
        padding: 1.2rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--surface);
        box-shadow: var(--shadow-soft);
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.85rem;
      }

      .field {
        display: grid;
        gap: 0.4rem;
        font-size: 0.92rem;
      }

      .field.wide {
        grid-column: 1 / -1;
      }

      .field span {
        font-weight: 800;
        color: var(--ink);
      }

      .field input,
      .field select,
      .field textarea {
        min-height: 2.7rem;
        padding: 0.5rem 0.8rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: rgba(255, 255, 255, 0.74);
        font: inherit;
        color: var(--ink);
        outline: none;
      }

      .field textarea {
        resize: vertical;
      }

      .field input:focus-visible,
      .field select:focus-visible,
      .field textarea:focus-visible {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(17, 78, 74, 0.16);
      }

      .form-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .primary-action,
      .secondary-action,
      .back-link {
        min-height: 2.5rem;
        display: inline-flex;
        align-items: center;
        padding: 0 0.95rem;
        border-radius: var(--radius-md);
        font-weight: 800;
        text-decoration: none;
        cursor: pointer;
        font: inherit;
      }

      .primary-action {
        border: 0;
        color: #ffffff;
        background: var(--accent);
      }

      .primary-action:hover:not([disabled]),
      .primary-action:focus-visible:not([disabled]) {
        background: var(--accent-hover);
        outline: none;
      }

      .secondary-action {
        border: 1px solid var(--line);
        color: var(--ink);
        background: rgba(255, 255, 255, 0.62);
      }

      [disabled] {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .state-panel {
        max-width: 46rem;
        padding: 1.2rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--surface);
        box-shadow: var(--shadow-soft);
      }

      .state-panel.alert {
        border-color: rgba(179, 38, 30, 0.28);
        background: rgba(255, 246, 241, 0.9);
      }

      .form-error {
        margin: 0;
        color: var(--danger);
        font-weight: 700;
      }

      @media (max-width: 720px) {
        .form-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfertaEmpresaFormPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly empresaOfertasService = inject(EmpresaOfertasService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly status = signal<FormStatus>('loading');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly editingId = signal<number | null>(null);

  protected readonly modalidadOptions: ModalidadOption[] = [
    { value: 'PRESENCIAL', label: 'Presencial' },
    { value: 'HIBRIDA', label: 'Hibrida' },
    { value: 'REMOTA', label: 'Remota' },
  ];

  protected readonly form = this.formBuilder.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(150)]],
    descripcion: ['', [Validators.required, Validators.maxLength(2000)]],
    familiaProfesional: ['', [Validators.required, Validators.maxLength(150)]],
    cicloFormativo: ['', [Validators.maxLength(150)]],
    localidad: ['', [Validators.required, Validators.maxLength(100)]],
    provincia: ['', [Validators.required, Validators.maxLength(100)]],
    modalidad: ['PRESENCIAL' as OfertaModalidad, [Validators.required]],
    plazas: [1, [Validators.required, Validators.min(1)]],
    fechaInicio: ['', [Validators.required]],
    fechaFin: ['', [Validators.required]],
    tareas: ['', [Validators.required, Validators.maxLength(2000)]],
    requisitos: ['', [Validators.maxLength(2000)]],
  });

  protected isEditMode(): boolean {
    return this.editingId() !== null;
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.status.set('not-authenticated');
      return;
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.status.set('ready');
      return;
    }

    const id = Number(idParam);
    if (Number.isNaN(id)) {
      this.status.set('not-found');
      return;
    }

    this.editingId.set(id);
    this.status.set('loading');

    this.empresaOfertasService
      .detail(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (oferta) => {
          this.form.reset({
            titulo: oferta.titulo,
            descripcion: oferta.descripcion,
            familiaProfesional: oferta.familiaProfesional,
            cicloFormativo: oferta.cicloFormativo ?? '',
            localidad: oferta.localidad,
            provincia: oferta.provincia,
            modalidad: oferta.modalidad,
            plazas: oferta.plazas,
            fechaInicio: oferta.fechaInicio,
            fechaFin: oferta.fechaFin,
            tareas: oferta.tareas,
            requisitos: oferta.requisitos ?? '',
          });
          this.status.set('ready');
        },
        error: (error: unknown) => {
          if (isUnauthorized(error)) {
            this.status.set('not-authenticated');
            return;
          }
          if (isNotFound(error)) {
            this.status.set('not-found');
            return;
          }
          this.errorMessage.set(submitErrorMessage(error));
          this.status.set('error');
        },
      });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Revisa los campos obligatorios y los limites de longitud.');
      return;
    }

    const raw = this.form.getRawValue();
    if (raw.fechaInicio && raw.fechaFin && raw.fechaInicio > raw.fechaFin) {
      this.errorMessage.set('La fecha de inicio debe ser anterior o igual a la fecha de fin.');
      return;
    }

    const request: OfertaFctRequest = {
      titulo: raw.titulo.trim(),
      descripcion: raw.descripcion.trim(),
      familiaProfesional: raw.familiaProfesional.trim(),
      cicloFormativo: raw.cicloFormativo.trim() || null,
      localidad: raw.localidad.trim(),
      provincia: raw.provincia.trim(),
      modalidad: raw.modalidad,
      fechaInicio: raw.fechaInicio,
      fechaFin: raw.fechaFin,
      plazas: raw.plazas,
      requisitos: raw.requisitos.trim() || null,
      tareas: raw.tareas.trim(),
    };

    this.errorMessage.set(null);
    this.status.set('saving');

    const editingId = this.editingId();
    const action$ = editingId === null
      ? this.empresaOfertasService.create(request)
      : this.empresaOfertasService.update(editingId, request);

    action$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.router.navigateByUrl('/empresa/ofertas');
      },
      error: (error: unknown) => {
        if (isUnauthorized(error)) {
          this.status.set('not-authenticated');
          return;
        }
        this.errorMessage.set(submitErrorMessage(error));
        this.status.set('ready');
      },
    });
  }
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 401;
}

function isNotFound(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 404;
}

function submitErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No se pudo contactar con el servidor. Comprueba que el backend este disponible.';
    }
    if (error.status === 400) {
      return 'Los datos enviados no son validos. Revisa el formulario.';
    }
    if (error.status === 403) {
      return 'No tienes permisos para gestionar ofertas.';
    }
    if (error.status === 409) {
      return 'No se pudo guardar: la oferta ya no esta en estado editable.';
    }
  }
  return 'No se pudo guardar la oferta. Intentalo de nuevo.';
}
