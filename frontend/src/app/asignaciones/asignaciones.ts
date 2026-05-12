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
import {
  AsignacionExternaCandidata,
  AsignacionFctExterna,
} from './asignaciones-externas.models';
import { AsignacionesExternasService } from './asignaciones-externas.service';
import {
  AsignacionCandidata,
  AsignacionEstado,
  AsignacionFct,
} from './asignaciones.models';
import { AsignacionesService } from './asignaciones.service';

type ListStatus = 'loading' | 'loaded' | 'empty' | 'error' | 'not-authenticated';
type SaveStatus = 'idle' | 'saving';
type EstadoFilter = 'TODAS' | AsignacionEstado;
type Origen = 'INTERNA' | 'EXTERNA';

type AsignacionItem = {
  key: string;
  origen: Origen;
  id: number;
  estado: AsignacionEstado;
  fechaAsignacion: string;
  observaciones: string | null;
  alumnoNombre: string;
  alumnoEmail: string | null;
  oferta: string;
  empresa: string;
};

type CandidataItem = {
  key: string;
  origen: Origen;
  solicitudInternaId: number | null;
  solicitudExternaId: number | null;
  alumnoNombre: string;
  alumnoEmail: string | null;
  titulo: string;
  empresa: string;
  fecha: string;
};

const ESTADO_LABEL: Record<AsignacionEstado, string> = {
  ACTIVA: 'Activa',
  FINALIZADA: 'Finalizada',
};

@Component({
  selector: 'app-asignaciones-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="page-shell route-page asignaciones-page">
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
      } @else {
        <section class="kpi-grid" aria-label="Resumen de asignaciones">
          <article class="kpi-card">
            <p class="eyebrow">Activas</p>
            <p class="kpi-value">{{ totalActivas() }}</p>
          </article>
          <article class="kpi-card">
            <p class="eyebrow">Finalizadas</p>
            <p class="kpi-value">{{ totalFinalizadas() }}</p>
          </article>
          <article class="kpi-card kpi-warn">
            <p class="eyebrow">Pendientes</p>
            <p class="kpi-value">{{ totalCandidatas() }}</p>
          </article>
          <article class="kpi-card">
            <p class="eyebrow">Total</p>
            <p class="kpi-value">{{ totalAsignaciones() }}</p>
          </article>
        </section>

        <section class="create-panel" aria-label="Crear asignacion">
          <p class="eyebrow">Nueva asignacion</p>
          <h2>Asignar desde solicitud aceptada</h2>
          @if (candidatasStatus() === 'loading') {
            <p class="muted">Cargando solicitudes pendientes de asignar...</p>
          } @else if (candidatas().length === 0) {
            <p class="muted">
              No hay solicitudes aceptadas pendientes de asignar. Cuando una empresa acepte una
              solicitud, aparecera aqui para que la oficialices.
            </p>
          } @else {
            <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
              <div class="form-row">
                <label for="candidataKey">Solicitud aceptada</label>
                <select id="candidataKey" formControlName="candidataKey">
                  <option [ngValue]="null">Selecciona una solicitud</option>
                  @for (c of candidatas(); track c.key) {
                    <option [ngValue]="c.key">
                      {{ c.alumnoNombre }} — {{ c.titulo }} ({{ c.empresa }})
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

        <section class="filters-panel" aria-label="Filtros de asignaciones">
          <p class="eyebrow">Asignaciones del centro</p>
          <div class="filters-row">
            <label class="filter-control">
              <span>Estado</span>
              <select [formControl]="estadoFilter">
                <option value="TODAS">Todas</option>
                <option value="ACTIVA">Activas</option>
                <option value="FINALIZADA">Finalizadas</option>
              </select>
            </label>
            <label class="filter-control">
              <span>Empresa</span>
              <select [formControl]="empresaFilter">
                <option value="">Todas las empresas</option>
                @for (empresa of empresaOptions(); track empresa) {
                  <option [value]="empresa">{{ empresa }}</option>
                }
              </select>
            </label>
            <p class="filter-summary">
              {{ filteredCount() }} de {{ totalAsignaciones() }} asignaciones
            </p>
          </div>
        </section>

        @if (totalAsignaciones() === 0) {
          <section class="state-panel">
            <p class="eyebrow">Sin asignaciones</p>
            <h2>Aun no hay asignaciones registradas</h2>
            <p>Cuando una empresa acepte una solicitud, podras registrarla desde el formulario.</p>
          </section>
        } @else if (filteredCount() === 0) {
          <section class="state-panel">
            <p class="eyebrow">Sin coincidencias</p>
            <h2>No hay asignaciones con esos filtros</h2>
            <p>Ajusta los filtros para ver el resto de asignaciones.</p>
          </section>
        } @else {
          <section class="asignaciones-results" aria-live="polite" aria-label="Asignaciones FCT">
            <div class="results-heading">
              <p class="eyebrow">Asignaciones</p>
              <h2>{{ resultsTitle() }}</h2>
            </div>

            <div class="asignaciones-grid">
              @for (item of filteredItems(); track item.key) {
                <article class="asignacion-card">
                  <div class="asignacion-card-heading">
                    <span class="estado-pill" [attr.data-estado]="item.estado">
                      {{ estadoLabel(item.estado) }}
                    </span>
                    <h3>{{ item.alumnoNombre }}</h3>
                    @if (item.alumnoEmail) {
                      <p class="asignacion-email">{{ item.alumnoEmail }}</p>
                    }
                  </div>

                  <dl class="asignacion-details" aria-label="Datos de la asignacion">
                    <div>
                      <dt>Oferta</dt>
                      <dd>{{ item.oferta }}</dd>
                    </div>
                    <div>
                      <dt>Empresa</dt>
                      <dd>{{ item.empresa }}</dd>
                    </div>
                    <div>
                      <dt>Fecha</dt>
                      <dd>{{ formatFecha(item.fechaAsignacion) }}</dd>
                    </div>
                    <div>
                      <dt>Asignacion</dt>
                      <dd>#{{ item.id }}</dd>
                    </div>
                  </dl>

                  @if (item.observaciones) {
                    <p class="asignacion-observaciones">{{ item.observaciones }}</p>
                  }
                </article>
              }
            </div>
          </section>
        }
      }
    </main>
  `,
  styles: [
    `
      .asignaciones-page {
        display: grid;
        gap: 1.4rem;
        padding-top: 2rem;
      }

      .kpi-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      }

      .kpi-card {
        padding: 1rem 1.1rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--surface);
        box-shadow: var(--shadow-soft);
        display: grid;
        gap: 0.35rem;
      }

      .kpi-card.kpi-warn {
        border-color: rgba(87, 96, 106, 0.45);
        background: rgba(255, 244, 230, 0.7);
      }

      .kpi-value {
        margin: 0;
        font-size: 2rem;
        font-weight: 800;
        line-height: 1;
        color: var(--ink);
      }

      .create-panel,
      .filters-panel,
      .state-panel {
        padding: 1.2rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--surface);
        box-shadow: var(--shadow-soft);
        display: grid;
        gap: 0.75rem;
      }

      .state-panel.alert {
        border-color: rgba(179, 38, 30, 0.28);
        background: rgba(255, 246, 241, 0.9);
      }

      .create-panel form {
        display: grid;
        gap: 0.85rem;
      }

      .form-row {
        display: grid;
        gap: 0.35rem;
      }

      .form-row label {
        font-size: 0.85rem;
        font-weight: 700;
      }

      .form-row select,
      .form-row textarea {
        padding: 0.55rem 0.7rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: rgba(255, 251, 245, 0.8);
        font: inherit;
      }

      .form-row textarea {
        resize: vertical;
      }

      .filters-row {
        display: flex;
        flex-wrap: wrap;
        align-items: end;
        gap: 1rem;
      }

      .filter-control {
        display: grid;
        gap: 0.3rem;
        font-size: 0.85rem;
        color: var(--muted);
      }

      .filter-control select {
        min-height: 2.4rem;
        padding: 0 0.6rem;
        border-radius: var(--radius-md);
        border: 1px solid var(--line);
        background: var(--surface);
        font: inherit;
      }

      .filter-summary {
        margin: 0;
        color: var(--muted);
        font-size: 0.85rem;
      }

      .results-heading {
        display: grid;
        gap: 0.35rem;
      }

      .asignaciones-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
      }

      .asignacion-card {
        display: grid;
        gap: 0.7rem;
        padding: 1rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: rgba(255, 251, 245, 0.72);
        box-shadow: var(--shadow-soft);
      }

      .asignacion-card-heading {
        display: grid;
        gap: 0.4rem;
      }

      .asignacion-card h3 {
        margin: 0;
        font-size: 1.1rem;
      }

      .asignacion-email {
        margin: 0;
        color: var(--muted);
        font-size: 0.9rem;
      }

      .estado-pill {
        align-self: start;
        display: inline-flex;
        align-items: center;
        min-height: 1.8rem;
        padding: 0 0.7rem;
        border-radius: var(--radius-sm);
        font-size: 0.76rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .estado-pill[data-estado='ACTIVA'] {
        background: rgba(29, 107, 74, 0.18);
        color: var(--success);
      }

      .estado-pill[data-estado='FINALIZADA'] {
        background: rgba(17, 78, 74, 0.18);
        color: var(--accent-hover);
      }

      .asignacion-details {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.55rem;
        margin: 0;
      }

      .asignacion-details dt {
        margin: 0;
        font-size: 0.74rem;
        font-weight: 800;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .asignacion-details dd {
        margin: 0.15rem 0 0;
        font-weight: 700;
      }

      .asignacion-observaciones {
        margin: 0;
        font-style: italic;
        color: var(--muted);
        line-height: 1.45;
      }

      .primary-action,
      .back-link {
        min-height: 2.5rem;
        display: inline-flex;
        align-items: center;
        padding: 0 0.85rem;
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

      [disabled] {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .action-feedback {
        margin: 0;
        font-weight: 700;
      }

      .muted {
        color: var(--muted);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsignacionesPage implements OnInit {
  private readonly asignacionesService = inject(AsignacionesService);
  private readonly externasService = inject(AsignacionesExternasService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly fb = inject(FormBuilder);

  protected readonly status = signal<ListStatus>('loading');
  protected readonly errorMessage = signal<string>('');
  protected readonly candidatasStatus = signal<'loading' | 'loaded'>('loading');
  protected readonly saveStatus = signal<SaveStatus>('idle');
  protected readonly createMessage = signal<string>('');

  private readonly internas = signal<AsignacionFct[]>([]);
  private readonly externas = signal<AsignacionFctExterna[]>([]);
  private readonly candidatasInternas = signal<AsignacionCandidata[]>([]);
  private readonly candidatasExternas = signal<AsignacionExternaCandidata[]>([]);

  protected readonly form = this.fb.group({
    candidataKey: this.fb.control<string | null>(null, { validators: [Validators.required] }),
    observaciones: this.fb.control<string>('', { nonNullable: true }),
  });

  protected readonly estadoFilter = this.fb.control<EstadoFilter>('TODAS', { nonNullable: true });
  protected readonly empresaFilter = this.fb.control<string>('', { nonNullable: true });
  private readonly estadoFilterValue = signal<EstadoFilter>('TODAS');
  private readonly empresaFilterValue = signal<string>('');

  protected readonly asignaciones = computed<AsignacionItem[]>(() => {
    const out: AsignacionItem[] = [];
    for (const a of this.internas()) {
      out.push({
        key: `int-${a.id}`,
        origen: 'INTERNA',
        id: a.id,
        estado: a.estado,
        fechaAsignacion: a.fechaAsignacion,
        observaciones: a.observaciones,
        alumnoNombre: a.alumno.displayName,
        alumnoEmail: a.alumno.email,
        oferta: a.oferta.titulo,
        empresa: a.empresa.nombre,
      });
    }
    for (const a of this.externas()) {
      out.push({
        key: `ext-${a.id}`,
        origen: 'EXTERNA',
        id: a.id,
        estado: a.estado,
        fechaAsignacion: a.fechaAsignacion,
        observaciones: a.observaciones,
        alumnoNombre: a.alumnoNombre,
        alumnoEmail: null,
        oferta: a.titulo,
        empresa: a.empresaNombre || 'Empresa externa',
      });
    }
    return out.sort((a, b) => b.fechaAsignacion.localeCompare(a.fechaAsignacion));
  });

  protected readonly candidatas = computed<CandidataItem[]>(() => {
    const out: CandidataItem[] = [];
    for (const c of this.candidatasInternas()) {
      out.push({
        key: `int-${c.solicitudId}`,
        origen: 'INTERNA',
        solicitudInternaId: c.solicitudId,
        solicitudExternaId: null,
        alumnoNombre: c.alumno.displayName,
        alumnoEmail: c.alumno.email,
        titulo: c.oferta.titulo,
        empresa: c.empresa.nombre,
        fecha: c.solicitadaEn,
      });
    }
    for (const c of this.candidatasExternas()) {
      out.push({
        key: `ext-${c.solicitudExternaId}`,
        origen: 'EXTERNA',
        solicitudInternaId: null,
        solicitudExternaId: c.solicitudExternaId,
        alumnoNombre: c.alumnoNombre,
        alumnoEmail: null,
        titulo: c.titulo,
        empresa: c.empresaNombre || 'Empresa externa',
        fecha: c.aceptadaEn,
      });
    }
    return out.sort((a, b) => b.fecha.localeCompare(a.fecha));
  });

  protected readonly totalActivas = computed(
    () => this.asignaciones().filter((a) => a.estado === 'ACTIVA').length,
  );
  protected readonly totalFinalizadas = computed(
    () => this.asignaciones().filter((a) => a.estado === 'FINALIZADA').length,
  );
  protected readonly totalAsignaciones = computed(() => this.asignaciones().length);
  protected readonly totalCandidatas = computed(() => this.candidatas().length);

  protected readonly empresaOptions = computed(() => {
    const set = new Set<string>();
    for (const a of this.asignaciones()) {
      if (a.empresa) set.add(a.empresa);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  });

  protected readonly filteredItems = computed(() => {
    const estado = this.estadoFilterValue();
    const empresa = this.empresaFilterValue();
    return this.asignaciones()
      .filter((item) => (estado === 'TODAS' ? true : item.estado === estado))
      .filter((item) => (empresa ? item.empresa === empresa : true));
  });

  protected readonly filteredCount = computed(() => this.filteredItems().length);

  protected readonly resultsTitle = computed(() => {
    const total = this.filteredCount();
    return total === 1 ? '1 asignacion encontrada' : `${total} asignaciones encontradas`;
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.estadoFilter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.estadoFilterValue.set(value ?? 'TODAS'));
    this.empresaFilter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.empresaFilterValue.set(value ?? ''));

    this.loadAll();
  }

  protected estadoLabel(estado: AsignacionEstado): string {
    return ESTADO_LABEL[estado];
  }

  protected formatFecha(value: string): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.saveStatus() === 'saving') {
      return;
    }
    const key = this.form.value.candidataKey ?? null;
    if (!key) return;
    const candidata = this.candidatas().find((c) => c.key === key);
    if (!candidata) {
      this.createMessage.set('La solicitud seleccionada ya no esta disponible.');
      return;
    }
    const observaciones = (this.form.value.observaciones ?? '').trim() || undefined;

    this.saveStatus.set('saving');
    this.createMessage.set('');

    if (candidata.origen === 'INTERNA' && candidata.solicitudInternaId !== null) {
      this.asignacionesService
        .create({ solicitudId: candidata.solicitudInternaId, observaciones })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.handleCreateSuccess(),
          error: (err) => this.handleCreateError(err),
        });
    } else if (candidata.origen === 'EXTERNA' && candidata.solicitudExternaId !== null) {
      this.externasService
        .create({ solicitudExternaId: candidata.solicitudExternaId, observaciones })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.handleCreateSuccess(),
          error: (err) => this.handleCreateError(err),
        });
    } else {
      this.saveStatus.set('idle');
    }
  }

  private handleCreateSuccess(): void {
    this.saveStatus.set('idle');
    this.createMessage.set('Asignacion creada correctamente.');
    this.form.reset({ candidataKey: null, observaciones: '' });
    this.loadAll();
  }

  private handleCreateError(err: unknown): void {
    this.saveStatus.set('idle');
    this.createMessage.set(this.describeError(err));
  }

  private loadAll(): void {
    this.status.set('loading');
    this.candidatasStatus.set('loading');
    this.errorMessage.set('');

    let pending = 4;
    let failed = false;
    const onDone = () => {
      pending -= 1;
      if (pending === 0 && !failed) {
        this.status.set(this.asignaciones().length === 0 ? 'empty' : 'loaded');
        if (this.status() === 'empty') this.status.set('loaded');
      }
    };
    const onError = (err: unknown) => {
      if (failed) return;
      failed = true;
      if (err instanceof HttpErrorResponse && err.status === 401) {
        this.status.set('not-authenticated');
        return;
      }
      this.status.set('error');
      this.errorMessage.set(this.describeError(err));
    };

    this.asignacionesService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.internas.set(data);
          onDone();
        },
        error: onError,
      });

    this.asignacionesService
      .listCandidatas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.candidatasInternas.set(data);
          this.candidatasStatus.set('loaded');
          onDone();
        },
        error: onError,
      });

    this.externasService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.externas.set(data);
          onDone();
        },
        error: onError,
      });

    this.externasService
      .listCandidatas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.candidatasExternas.set(data);
          onDone();
        },
        error: onError,
      });
  }

  private describeError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 401 || err.status === 403) {
        return 'Tu sesion no tiene permisos de tutor o coordinador.';
      }
      if (err.status === 0) {
        return 'No se pudo contactar con el servidor.';
      }
      return `Error ${err.status} al cargar datos.`;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return 'Error desconocido al cargar datos.';
  }
}
