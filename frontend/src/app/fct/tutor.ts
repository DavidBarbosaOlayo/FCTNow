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
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { TutorAlumno } from './tutor-alumnos.models';
import { TutorAlumnosService } from './tutor-alumnos.service';

type LoadStatus = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-tutor-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="page-shell route-page tutor-page">
      <header class="route-hero">
        <p class="eyebrow">Tutor centro</p>
        <h1>Alumnado del centro</h1>
        <p>
          Listado completo del alumnado con datos personales, preferencias, actividad de
          solicitudes y asignación actual si la tiene.
        </p>
        @if (currentUserName(); as nombre) {
          <p class="muted welcome-line">Sesión activa como <strong>{{ nombre }}</strong>.</p>
        }
      </header>

      <section class="kpi-grid" aria-label="Resumen del alumnado">
        <article class="kpi-card">
          <p class="eyebrow">Alumnos</p>
          <p class="kpi-value">{{ alumnos().length }}</p>
        </article>
        <article class="kpi-card">
          <p class="eyebrow">Asignados</p>
          <p class="kpi-value">
            {{ totalAsignados() }}<span class="kpi-total">/{{ alumnos().length }}</span>
          </p>
        </article>
        <article class="kpi-card">
          <p class="eyebrow">Aceptados</p>
          <p class="kpi-value">
            {{ totalAceptados() }}<span class="kpi-total">/{{ alumnos().length }}</span>
          </p>
        </article>
        <article class="kpi-card kpi-warn">
          <p class="eyebrow">Solicitudes pendientes</p>
          <p class="kpi-value">{{ totalSolicitudesPendientes() }}</p>
        </article>
      </section>

      <section class="filters-panel" aria-label="Filtros de alumnado">
        <div class="filters-row">
          <label class="filter-control">
            <span>Buscar</span>
            <input
              type="search"
              [formControl]="searchFilter"
              placeholder="Nombre, email o ciclo"
            />
          </label>
          <label class="filter-control">
            <span>Estado FCT</span>
            <select [formControl]="estadoFilter">
              <option value="TODOS">Todos</option>
              <option value="ASIGNADO">Con asignación</option>
              <option value="SIN_ASIGNAR">Sin asignación</option>
            </select>
          </label>
          <p class="filter-summary">
            {{ filteredAlumnos().length }} de {{ alumnos().length }} alumnos
          </p>
          <a class="ghost-action" routerLink="/asignaciones">Ir a asignaciones</a>
        </div>
      </section>

      @if (status() === 'loading') {
        <section class="state-panel" aria-live="polite">
          <p class="eyebrow">Cargando</p>
          <h2>Recuperando alumnado del centro</h2>
        </section>
      } @else if (status() === 'error') {
        <section class="state-panel alert" role="alert">
          <p class="eyebrow">Error</p>
          <h2>No se pudo cargar el listado</h2>
          <p>{{ errorMessage() }}</p>
        </section>
      } @else if (filteredAlumnos().length === 0) {
        <section class="state-panel">
          <p class="eyebrow">Sin coincidencias</p>
          <h2>No hay alumnos con esos filtros</h2>
        </section>
      } @else {
        <section class="alumno-grid" aria-label="Listado detallado de alumnos">
          @for (a of filteredAlumnos(); track a.id) {
            <article class="alumno-card">
              <header class="alumno-card-heading">
                <div>
                  <h3>{{ a.displayName }}</h3>
                  <p class="alumno-email">{{ a.email }}</p>
                </div>
                @if (a.asignacionActual) {
                  <span class="estado-pill" [attr.data-estado]="a.asignacionActual.estado">
                    {{ estadoLabel(a.asignacionActual.estado) }}
                  </span>
                } @else {
                  <span class="estado-pill estado-sin">Sin asignación</span>
                }
              </header>

              <dl class="alumno-details" aria-label="Datos académicos">
                <div>
                  <dt>Familia profesional</dt>
                  <dd>{{ a.preferencias?.familiaProfesional || '—' }}</dd>
                </div>
                <div>
                  <dt>Ciclo formativo</dt>
                  <dd>{{ a.preferencias?.cicloFormativo || '—' }}</dd>
                </div>
                <div>
                  <dt>Localidad</dt>
                  <dd>{{ a.preferencias?.localidad || '—' }}</dd>
                </div>
                <div>
                  <dt>Modalidad</dt>
                  <dd>{{ a.preferencias?.modalidad || '—' }}</dd>
                </div>
                <div>
                  <dt>Disponibilidad</dt>
                  <dd>{{ formatFecha(a.preferencias?.fechaDisponibilidad) || '—' }}</dd>
                </div>
              </dl>

              <div class="alumno-solicitudes" aria-label="Resumen de solicitudes">
                <div class="counter">
                  <span class="counter-value">{{ a.solicitudes.total }}</span>
                  <span class="counter-label">Total</span>
                </div>
                <div class="counter counter-warn">
                  <span class="counter-value">{{ a.solicitudes.solicitadas }}</span>
                  <span class="counter-label">Pendientes</span>
                </div>
                <div class="counter counter-ok">
                  <span class="counter-value">{{ a.solicitudes.aceptadas }}</span>
                  <span class="counter-label">Aceptadas</span>
                </div>
                <div class="counter counter-bad">
                  <span class="counter-value">{{ a.solicitudes.rechazadas }}</span>
                  <span class="counter-label">Rechazadas</span>
                </div>
              </div>

              @if (a.asignacionActual) {
                <section class="asignacion-actual" aria-label="Asignación actual">
                  <p class="eyebrow">Asignación actual</p>
                  <p class="asignacion-line">
                    <strong>{{ a.asignacionActual.empresa }}</strong> · {{ a.asignacionActual.oferta }}
                  </p>
                  <p class="muted">
                    Desde {{ formatFecha(a.asignacionActual.fechaAsignacion) }}
                  </p>
                  @if (a.asignacionActual.observaciones) {
                    <p class="muted observaciones">{{ a.asignacionActual.observaciones }}</p>
                  }
                </section>
              } @else if (a.solicitudes.aceptadas > 0) {
                <p class="hint">
                  Tiene {{ a.solicitudes.aceptadas }} solicitud(es) aceptadas pendientes de
                  oficializar.
                  <a routerLink="/asignaciones">Crear asignación</a>
                </p>
              }
            </article>
          }
        </section>
      }
    </main>
  `,
  styles: [
    `
      .tutor-page {
        display: grid;
        gap: 1.4rem;
      }

      .welcome-line {
        margin-top: 0.4rem;
      }

      .kpi-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      }

      .kpi-card {
        padding: 1rem 1.1rem;
        border-radius: 0.75rem;
        background: var(--surface, #fff);
        border: 1px solid rgba(15, 95, 89, 0.15);
        box-shadow: 0 6px 18px rgba(15, 95, 89, 0.06);
        display: grid;
        gap: 0.35rem;
      }

      .kpi-card.kpi-warn {
        border-color: rgba(199, 101, 59, 0.45);
        background: rgba(255, 244, 230, 0.6);
      }

      .kpi-value {
        margin: 0;
        font-size: 2rem;
        font-weight: 800;
        line-height: 1;
        color: var(--ink);
      }

      .kpi-total {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--muted);
        margin-left: 0.15rem;
      }

      .filters-panel,
      .state-panel {
        padding: 1.1rem 1.2rem;
        border-radius: 0.75rem;
        background: var(--surface, #fff);
        border: 1px solid rgba(15, 95, 89, 0.15);
      }

      .state-panel.alert {
        border-color: rgba(199, 101, 59, 0.45);
        background: rgba(255, 244, 230, 0.6);
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

      .filter-control input,
      .filter-control select {
        min-height: 2.4rem;
        padding: 0 0.6rem;
        border-radius: 0.45rem;
        border: 1px solid rgba(15, 95, 89, 0.25);
        background: #fff;
        font: inherit;
      }

      .filter-summary {
        margin: 0;
        color: var(--muted);
        font-size: 0.85rem;
        flex: 1 0 auto;
      }

      .ghost-action {
        min-height: 2.4rem;
        display: inline-flex;
        align-items: center;
        padding: 0 0.85rem;
        border-radius: 0.45rem;
        font-weight: 800;
        text-decoration: none;
        color: var(--accent);
        border: 1px solid currentColor;
      }

      .ghost-action:hover,
      .ghost-action:focus-visible {
        background: rgba(15, 95, 89, 0.08);
        outline: none;
      }

      .alumno-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
        align-items: start;
      }

      .alumno-card {
        padding: 1rem 1.1rem;
        border-radius: 0.75rem;
        background: var(--surface, #fff);
        border: 1px solid rgba(15, 95, 89, 0.15);
        display: grid;
        gap: 0.85rem;
        align-content: start;
      }

      .alumno-card-heading {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.75rem;
      }

      .alumno-card-heading h3 {
        margin: 0;
        font-size: 1.1rem;
      }

      .alumno-email {
        margin: 0.15rem 0 0;
        color: var(--muted);
        font-size: 0.85rem;
      }

      .estado-pill {
        align-self: start;
        display: inline-flex;
        align-items: center;
        padding: 0 0.7rem;
        min-height: 1.7rem;
        border-radius: 999px;
        font-size: 0.7rem;
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

      .estado-pill.estado-sin {
        background: rgba(0, 0, 0, 0.08);
        color: var(--muted);
      }

      .alumno-details {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.5rem;
        margin: 0;
      }

      .alumno-details dt {
        margin: 0;
        font-size: 0.7rem;
        font-weight: 800;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .alumno-details dd {
        margin: 0.15rem 0 0;
        font-weight: 600;
      }

      .alumno-solicitudes {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0.4rem;
      }

      .counter {
        padding: 0.45rem 0.35rem;
        border-radius: 0.45rem;
        background: rgba(15, 95, 89, 0.06);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        gap: 0.15rem;
        min-width: 0;
      }

      .counter-value {
        font-weight: 800;
        font-size: 1.05rem;
        line-height: 1;
      }

      .counter-label {
        font-size: 0.62rem;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .counter-warn {
        background: rgba(199, 101, 59, 0.18);
      }

      .counter-ok {
        background: rgba(46, 125, 50, 0.18);
        color: #1b5e20;
      }

      .counter-bad {
        background: rgba(184, 79, 59, 0.18);
        color: #8a3a26;
      }

      .asignacion-actual {
        padding: 0.7rem 0.9rem;
        background: rgba(15, 95, 89, 0.05);
        border-radius: 0.55rem;
        display: grid;
        gap: 0.2rem;
      }

      .asignacion-line {
        margin: 0;
        font-weight: 700;
      }

      .observaciones {
        font-style: italic;
      }

      .muted {
        color: var(--muted);
        margin: 0;
      }

      .hint {
        margin: 0;
        font-size: 0.85rem;
        color: var(--muted);
      }

      .hint a {
        color: var(--accent);
        font-weight: 700;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TutorPage implements OnInit {
  private readonly tutorService = inject(TutorAlumnosService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly currentUserName = computed(
    () => this.authService.currentUser()?.displayName ?? null,
  );

  protected readonly status = signal<LoadStatus>('loading');
  protected readonly errorMessage = signal<string>('');
  protected readonly alumnos = signal<TutorAlumno[]>([]);

  protected readonly searchFilter = new FormControl<string>('', { nonNullable: true });
  protected readonly estadoFilter = new FormControl<'TODOS' | 'ASIGNADO' | 'SIN_ASIGNAR'>(
    'TODOS',
    { nonNullable: true },
  );
  private readonly searchValue = signal<string>('');
  private readonly estadoValue = signal<'TODOS' | 'ASIGNADO' | 'SIN_ASIGNAR'>('TODOS');

  protected readonly totalAsignados = computed(
    () => this.alumnos().filter((a) => !!a.asignacionActual).length,
  );
  protected readonly totalAceptados = computed(
    () => this.alumnos().filter((a) => a.solicitudes.aceptadas > 0).length,
  );
  protected readonly totalSolicitudesPendientes = computed(() =>
    this.alumnos().reduce((sum, a) => sum + a.solicitudes.solicitadas, 0),
  );

  protected readonly filteredAlumnos = computed(() => {
    const q = this.searchValue().trim().toLowerCase();
    const estado = this.estadoValue();
    return this.alumnos().filter((a) => {
      if (estado === 'ASIGNADO' && !a.asignacionActual) return false;
      if (estado === 'SIN_ASIGNAR' && a.asignacionActual) return false;
      if (!q) return true;
      const ciclo = a.preferencias?.cicloFormativo?.toLowerCase() ?? '';
      const familia = a.preferencias?.familiaProfesional?.toLowerCase() ?? '';
      return (
        a.displayName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        ciclo.includes(q) ||
        familia.includes(q)
      );
    });
  });

  ngOnInit(): void {
    this.searchFilter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.searchValue.set(value ?? ''));
    this.estadoFilter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.estadoValue.set(value ?? 'TODOS'));

    this.load();
  }

  protected estadoLabel(estado: 'ACTIVA' | 'FINALIZADA'): string {
    return estado === 'ACTIVA' ? 'Activa' : 'Finalizada';
  }

  protected formatFecha(value: string | null | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private load(): void {
    this.status.set('loading');
    this.errorMessage.set('');
    this.tutorService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.alumnos.set(data);
          this.status.set('loaded');
        },
        error: (err) => {
          this.status.set('error');
          this.errorMessage.set(this.describeError(err));
        },
      });
  }

  private describeError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 401 || err.status === 403) {
        return 'Tu sesión no tiene permisos de tutor o coordinador.';
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
