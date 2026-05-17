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
import { Router, RouterLink } from '@angular/router';
import { PreferenciasCacheService } from '../alumnos/preferencias-cache.service';
import { PreferenciasAlumnoPage } from '../alumnos/preferencias';
import { AlumnoAsignacionActual } from '../alumnos/asignacion-actual.models';
import { AlumnoAsignacionActualService } from '../alumnos/asignacion-actual.service';
import { AuthenticatedUser, UserRole } from '../auth/auth.models';
import { AuthService } from '../auth/auth.service';
import { AlumnoPreferenciasService } from '../alumnos/preferencias.service';
import { EmpresaPerfilPage } from '../empresas/empresa-perfil';
import { calcFctProgress } from '../asignaciones/fct-progress';
import { UserProfilePhotoService } from './user-profile-photo.service';

type ProfileStatus = 'loading' | 'loaded' | 'error' | 'not-authenticated';
type AssignmentStatus = 'idle' | 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-perfil-page',
  imports: [EmpresaPerfilPage, PreferenciasAlumnoPage, RouterLink],
  template: `
    <main class="page-shell route-page profile-page">
      @if (status() === 'loading') {
        <section class="state-panel" aria-live="polite">
          <p class="eyebrow">Cargando</p>
          <h2>Recuperando tu perfil</h2>
          <p>Estamos consultando la sesión activa para mostrar tus datos básicos.</p>
        </section>
      } @else if (status() === 'not-authenticated') {
        <section class="state-panel alert" role="alert">
          <p class="eyebrow">Sesión no disponible</p>
          <h2>Inicia sesión para ver tu perfil</h2>
          <p>Necesitas una sesión activa para consultar los datos del usuario autenticado.</p>
          <a class="back-link" routerLink="/login">Iniciar Sesión</a>
        </section>
      } @else if (status() === 'error') {
        <section class="state-panel alert" role="alert">
          <p class="eyebrow">Error</p>
          <h2>No se pudo cargar tu perfil</h2>
          <p>{{ errorMessage() }}</p>
        </section>
      } @else if (user(); as user) {
        <section class="profile-panel" aria-labelledby="profile-title">
          <div class="profile-summary">
            <span class="profile-avatar" [class.has-photo]="!!profilePhotoDataUrl()">
              <button
                type="button"
                class="profile-avatar-button"
                [class.is-editable]="canEditPhoto(user)"
                [disabled]="!canEditPhoto(user)"
                [attr.aria-label]="canEditPhoto(user) ? 'Cambiar foto de perfil' : null"
                (click)="openPhotoPicker()"
              >
                @if (profilePhotoDataUrl(); as photo) {
                  <img [src]="photo" alt="Foto identificativa del alumno" />
                } @else {
                  <span aria-hidden="true">{{ initials(user.displayName) }}</span>
                }
                @if (canEditPhoto(user)) {
                  <span class="photo-edit-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M4 17.3V20h2.7L17.8 8.9l-2.7-2.7L4 17.3Zm15.9-10.5c.3-.3.3-.8 0-1.1l-1.6-1.6c-.3-.3-.8-.3-1.1 0l-1.2 1.2L18.7 8l1.2-1.2Z" />
                    </svg>
                  </span>
                }
              </button>
            </span>

            <div class="profile-copy">
              <p class="eyebrow">Sesión activa</p>
              <div class="profile-title-row">
                <h2 id="profile-title">{{ user.displayName }}</h2>
                <div class="role-cloud" aria-label="Rol de usuario">
                  @if (user.roles[0]; as role) {
                    <span>{{ roleLabel(role) }}</span>
                  }
                </div>
              </div>
              <p>{{ user.email }}</p>
            </div>
          </div>

          <p class="identity-note">
            Nombre, correo y rol se gestionan desde la cuenta del centro y no se editan desde este formulario.
          </p>

          <dl class="profile-details" aria-label="Datos básicos del perfil">
            <div>
              <dt>Nombre visible</dt>
              <dd>{{ user.displayName }}</dd>
            </div>
            <div>
              <dt>Usuario</dt>
              <dd>{{ user.email }}</dd>
            </div>
            <div>
              <dt>Rol</dt>
              <dd>{{ user.roles[0] ? roleLabel(user.roles[0]) : '—' }}</dd>
            </div>
          </dl>
        </section>

        @if (user.roles.includes('ALUMNO')) {
          <div class="profile-role-row" [class.is-editing]="alumnoPreferencesEditing()">
            <section class="profile-role-section" aria-label="Datos editables del alumno">
              @if (assignmentStatus() === 'loading') {
                <section class="student-assignment-panel" aria-live="polite">
                  <p class="eyebrow">Practicas actuales</p>
                  <h3>Comprobando si tienes una asignacion activa</h3>
                </section>
              } @else if (assignmentStatus() === 'error') {
                <section class="student-assignment-panel alert" role="alert">
                  <p class="eyebrow">Practicas actuales</p>
                  <h3>No se pudo cargar tu asignacion</h3>
                  <p>{{ assignmentErrorMessage() }}</p>
                </section>
              } @else if (alumnoAssignment(); as asignacion) {
                <section class="student-assignment-panel" aria-label="Practicas actuales del alumno">
                  <div class="assignment-heading">
                    <div>
                      <p class="eyebrow">Practicas actuales</p>
                      <h3>{{ asignacion.empresa.nombre }}</h3>
                      <p>{{ asignacion.oferta.titulo }}</p>
                    </div>
                    <span class="estado-pill" [attr.data-estado]="asignacion.estado">
                      {{ assignmentEstadoLabel(asignacion.estado) }}
                    </span>
                  </div>

                  <div class="progress-block">
                    <div class="progress-copy">
                      <strong>{{ progressFor(asignacion).percent }}%</strong>
                      <span>{{ progressLabel(asignacion) }}</span>
                    </div>
                    <div class="progress-track" aria-hidden="true">
                      <span [style.width.%]="progressFor(asignacion).percent"></span>
                    </div>
                  </div>

                  <dl class="assignment-details" aria-label="Detalle de practicas">
                    <div>
                      <dt>Inicio</dt>
                      <dd>{{ formatFechaInicio(asignacion.seguimiento.fechaInicio) }}</dd>
                    </div>
                    <div>
                      <dt>Horas totales</dt>
                      <dd>{{ asignacion.seguimiento.horasTotales }} h</dd>
                    </div>
                    <div>
                      <dt>Jornada estimada</dt>
                      <dd>{{ asignacion.seguimiento.horasDiariasEstimadas }} h/dia</dd>
                    </div>
                    <div>
                      <dt>Ubicacion</dt>
                      <dd>{{ locationLabel(asignacion) }}</dd>
                    </div>
                    <div>
                      <dt>Retribucion</dt>
                      <dd>{{ compensationLabel(asignacion) }}</dd>
                    </div>
                    <div>
                      <dt>Asignada</dt>
                      <dd>{{ formatFecha(asignacion.fechaAsignacion) }}</dd>
                    </div>
                  </dl>

                  @if (asignacion.observaciones) {
                    <p class="assignment-note">{{ asignacion.observaciones }}</p>
                  }
                  @if (asignacion.seguimiento.observacionesRetribucion) {
                    <p class="assignment-note">
                      {{ asignacion.seguimiento.observacionesRetribucion }}
                    </p>
                  }
                  @if (asignacion.urlAplicacion) {
                    <a
                      class="assignment-link"
                      [href]="asignacion.urlAplicacion"
                      [attr.target]="asignacion.origen === 'EXTERNA' ? '_blank' : null"
                      [attr.rel]="asignacion.origen === 'EXTERNA' ? 'noopener' : null"
                    >
                      Ver oferta
                    </a>
                  }
                </section>
              }

              <app-preferencias-alumno-page
                [embedded]="true"
                [showPhoto]="false"
                (editingChange)="alumnoPreferencesEditing.set($event)"
                (photoChange)="profilePhotoDataUrl.set($event)"
              />
            </section>
            <button type="button" class="logout-action" (click)="logout()">
              Cerrar sesión
            </button>
          </div>
        } @else if (user.roles.includes('EMPRESA')) {
          <div class="profile-role-row">
            <section class="profile-role-section" aria-label="Perfil de empresa">
              <app-empresa-perfil-page [embedded]="true" />
            </section>
            <button type="button" class="logout-action" (click)="logout()">
              Cerrar sesión
            </button>
          </div>
        } @else if (isStaff(user)) {
          <div class="profile-role-row">
            <input
              type="file"
              class="staff-photo-input"
              accept="image/jpeg,image/png,image/webp"
              hidden
              (change)="onStaffPhotoSelected($event)"
            />
            @if (photoUploadError(); as msg) {
              <p class="photo-error" role="alert">{{ msg }}</p>
            }
            <button type="button" class="logout-action" (click)="logout()">
              Cerrar sesión
            </button>
          </div>
        } @else {
          <div class="profile-role-row">
            <button type="button" class="logout-action" (click)="logout()">
              Cerrar sesión
            </button>
          </div>
        }
      }
    </main>
  `,
  styles: [
    `
      .profile-page {
        align-content: start;
        gap: 0.75rem;
        padding-top: 2rem;
        overflow: visible;
      }

      .state-panel,
      .profile-panel {
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-soft);
        background: var(--surface);
      }

      .state-panel {
        max-width: 46rem;
        padding: 1.2rem;
      }

      .state-panel p:not(.eyebrow) {
        margin: 0.7rem 0 0;
        color: var(--muted);
        line-height: 1.65;
      }

      .state-panel.alert {
        border-color: rgba(179, 38, 30, 0.28);
        background: var(--danger-soft);
      }

      :host-context(.theme-dark) .state-panel.alert {
        border-color: rgba(255, 138, 128, 0.4);
      }

      .state-panel h2,
      .profile-copy h2 {
        margin: 0;
        font-family: inherit;
        line-height: 1.2;
        font-size: 1.45rem;
      }

      .profile-panel {
        display: grid;
        gap: 0.65rem;
        padding: 1rem;
      }

      .profile-summary {
        display: flex;
        gap: 1rem;
        align-items: center;
      }

      .profile-avatar {
        width: 5.25rem;
        height: 5.25rem;
        flex: 0 0 auto;
        position: relative;
        overflow: visible;
      }

      .profile-avatar-button {
        width: 100%;
        height: 100%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: visible;
        padding: 0;
        border: 0;
        border-radius: var(--radius-pill);
        color: var(--accent);
        background: var(--accent-soft);
        font: inherit;
        font-size: 1.35rem;
        font-weight: 800;
        cursor: default;
      }

      .profile-avatar-button::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 0;
        border-radius: inherit;
        background: var(--accent-soft);
      }

      .profile-avatar-button > span:not(.photo-edit-icon),
      .profile-avatar-button > img {
        position: relative;
        z-index: 1;
      }

      .profile-avatar.has-photo {
        background: transparent;
      }

      .profile-avatar-button.is-editable {
        cursor: pointer;
      }

      .profile-avatar-button.is-editable:hover,
      .profile-avatar-button.is-editable:focus-visible {
        outline: 3px solid rgba(17, 78, 74, 0.22);
        outline-offset: 3px;
      }

      .profile-avatar-button:disabled {
        opacity: 1;
      }

      .profile-avatar img,
      .profile-avatar-button img {
        width: 100%;
        height: 100%;
        border-radius: var(--radius-pill);
        object-fit: cover;
        overflow: hidden;
      }

      .photo-edit-icon {
        width: 1.8rem;
        height: 1.8rem;
        position: absolute;
        right: -0.15rem;
        bottom: -0.15rem;
        z-index: 2;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--surface);
        border-radius: var(--radius-pill);
        color: #ffffff;
        background: var(--accent);
      }

      .photo-edit-icon svg {
        width: 1rem;
        height: 1rem;
        fill: currentColor;
      }

      .profile-copy {
        min-width: 0;
        display: grid;
        gap: 0.35rem;
      }

      .profile-title-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.55rem;
      }

      .profile-copy p:not(.eyebrow) {
        margin: 0.35rem 0 0;
        color: var(--muted);
        line-height: 1.6;
      }

      .profile-details dd {
        margin: 0.35rem 0 0;
        color: var(--muted);
        line-height: 1.6;
      }

      .identity-note {
        margin: 0;
        color: var(--muted);
        font-size: 0.9rem;
        line-height: 1.5;
      }

      .role-cloud {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }

      .role-cloud span {
        min-height: 1.7rem;
        display: inline-flex;
        align-items: center;
        padding: 0 0.6rem;
        border: 1px solid rgba(17, 78, 74, 0.2);
        border-radius: var(--radius-sm);
        color: var(--accent);
        background: var(--accent-soft);
        font-size: 0.78rem;
        font-weight: 800;
      }

      .profile-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        flex-wrap: wrap;
        padding-top: 0.25rem;
      }

      .photo-error {
        margin: 0;
        color: var(--danger);
        font-size: 0.9rem;
      }

      .logout-action {
        min-height: 2.5rem;
        padding: 0 0.95rem;
        border: 1px solid rgba(179, 38, 30, 0.4);
        border-radius: var(--radius-md);
        background: var(--danger-soft);
        color: var(--danger);
        font: inherit;
        font-weight: 800;
        cursor: pointer;
      }

      .logout-action:hover,
      .logout-action:focus-visible {
        border-color: rgba(179, 38, 30, 0.65);
        filter: brightness(0.96);
        outline: none;
      }

      :host-context(.theme-dark) .logout-action {
        border-color: rgba(255, 138, 128, 0.42);
      }

      :host-context(.theme-dark) .logout-action:hover,
      :host-context(.theme-dark) .logout-action:focus-visible {
        border-color: rgba(255, 138, 128, 0.62);
        filter: brightness(1.1);
      }

      .profile-details {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.65rem;
        margin: 0;
      }

      .profile-details div {
        min-width: 0;
        padding: 0.7rem 0.8rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--canvas-deep);
      }

      .profile-details dt {
        color: var(--muted);
        font-size: 0.78rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .profile-details dd {
        color: var(--ink);
        font-weight: 800;
      }

      .profile-role-row {
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 0.65rem;
        align-items: start;
      }

      .profile-role-row.is-editing {
        align-items: start;
      }

      .profile-role-row > .logout-action {
        justify-self: end;
        width: max-content;
        max-width: 100%;
      }

      .profile-role-section {
        display: grid;
        gap: 1rem;
        min-width: 0;
        min-height: 0;
      }

      .student-assignment-panel {
        display: grid;
        gap: 0.85rem;
        padding: 1rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--surface);
        box-shadow: var(--shadow-soft);
      }

      .student-assignment-panel.alert {
        border-color: rgba(179, 38, 30, 0.28);
        background: var(--danger-soft);
      }

      .student-assignment-panel h3 {
        margin: 0;
        font-size: 1.15rem;
      }

      .student-assignment-panel p {
        margin: 0;
      }

      .assignment-heading {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 1rem;
      }

      .assignment-heading p:not(.eyebrow) {
        margin-top: 0.25rem;
        color: var(--muted);
        line-height: 1.45;
      }

      .estado-pill {
        min-height: 1.8rem;
        display: inline-flex;
        align-items: center;
        padding: 0 0.7rem;
        border-radius: var(--radius-sm);
        font-size: 0.76rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        white-space: nowrap;
      }

      .estado-pill[data-estado='ACTIVA'] {
        color: var(--success);
        background: rgba(29, 107, 74, 0.18);
      }

      .estado-pill[data-estado='FINALIZADA'] {
        color: var(--accent-hover);
        background: rgba(17, 78, 74, 0.18);
      }

      .progress-block {
        display: grid;
        gap: 0.45rem;
      }

      .progress-copy {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 0.5rem;
        color: var(--muted);
        font-size: 0.9rem;
      }

      .progress-copy strong {
        color: var(--ink);
      }

      .progress-track {
        height: 0.55rem;
        overflow: hidden;
        border-radius: var(--radius-pill);
        background: var(--canvas-deep);
      }

      .progress-track span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: var(--accent);
      }

      .assignment-details {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.55rem;
        margin: 0;
      }

      .assignment-details div {
        min-width: 0;
        padding: 0.65rem 0.7rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--canvas-deep);
      }

      .assignment-details dt {
        color: var(--muted);
        font-size: 0.72rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .assignment-details dd {
        margin: 0.2rem 0 0;
        font-weight: 800;
        line-height: 1.35;
      }

      .assignment-note {
        color: var(--muted);
        line-height: 1.5;
      }

      .assignment-link {
        justify-self: start;
        min-height: 2.35rem;
        display: inline-flex;
        align-items: center;
        padding: 0 0.8rem;
        border: 1px solid rgba(17, 78, 74, 0.28);
        border-radius: var(--radius-md);
        color: var(--accent);
        background: var(--accent-soft);
        font-weight: 800;
        text-decoration: none;
      }

      .back-link {
        justify-self: start;
        min-height: 2.4rem;
        display: inline-flex;
        align-items: center;
        padding: 0 0.8rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        color: var(--ink);
        background: var(--surface-muted);
        font-weight: 800;
        text-decoration: none;
      }

      .state-panel.alert .back-link {
        margin-top: 0.85rem;
      }

      .back-link:hover,
      .back-link:focus-visible {
        border-color: rgba(17, 78, 74, 0.36);
        outline: none;
      }

      @media (max-width: 820px) {
        .profile-summary {
          align-items: flex-start;
        }

        .profile-details {
          grid-template-columns: 1fr;
        }

        .assignment-details {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 620px) {
        .profile-page {
          height: auto;
          min-height: 100dvh;
          padding-top: 1rem;
          overflow: visible;
        }

        .profile-summary {
          display: grid;
        }

        .profile-avatar {
          width: 4.75rem;
          height: 4.75rem;
        }

        .profile-role-row {
          grid-template-columns: 1fr;
        }

        .assignment-heading {
          display: grid;
        }

        .assignment-details {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly preferenciasService = inject(AlumnoPreferenciasService);
  private readonly alumnoAsignacionService = inject(AlumnoAsignacionActualService);
  private readonly preferenciasCache = inject(PreferenciasCacheService);
  private readonly userPhotoService = inject(UserProfilePhotoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  protected readonly status = signal<ProfileStatus>('loading');
  protected readonly user = signal<AuthenticatedUser | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly profilePhotoDataUrl = signal<string | null>(null);
  protected readonly alumnoPreferencesEditing = signal(false);
  protected readonly photoUploadError = signal<string | null>(null);
  protected readonly photoUploading = signal(false);
  protected readonly assignmentStatus = signal<AssignmentStatus>('idle');
  protected readonly assignmentErrorMessage = signal<string | null>(null);
  protected readonly alumnoAssignment = signal<AlumnoAsignacionActual | null>(null);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.status.set('not-authenticated');
      return;
    }

    if (!this.authService.accessToken()) {
      this.status.set('not-authenticated');
      return;
    }

    this.errorMessage.set(null);

    const cachedUser = this.authService.currentUser();
    if (cachedUser) {
      this.user.set(cachedUser);
      this.status.set('loaded');
      this.loadAlumnoPhoto(cachedUser);
      this.loadAlumnoAssignment(cachedUser);
      return;
    }

    this.status.set('loading');
    this.authService
      .loadAuthenticatedUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.user.set(user);
          this.status.set('loaded');
          this.loadAlumnoPhoto(user);
          this.loadAlumnoAssignment(user);
        },
        error: (error: unknown) => {
          this.user.set(null);

          if (isUnauthorized(error)) {
            this.status.set('not-authenticated');
            return;
          }

          this.errorMessage.set(profileErrorMessage(error));
          this.status.set('error');
        },
      });
  }

  protected roleLabel(role: UserRole): string {
    return ROLE_LABELS[role] ?? role;
  }

  protected rolesText(roles: UserRole[]): string {
    return roles.map((role) => this.roleLabel(role)).join(', ');
  }

  protected assignmentEstadoLabel(estado: 'ACTIVA' | 'FINALIZADA'): string {
    return estado === 'ACTIVA' ? 'En curso' : 'Finalizada';
  }

  protected progressFor(asignacion: AlumnoAsignacionActual) {
    return calcFctProgress(asignacion.seguimiento);
  }

  protected progressLabel(asignacion: AlumnoAsignacionActual): string {
    const progress = this.progressFor(asignacion);
    if (progress.status === 'pendiente') {
      return 'Comienza el ' + this.formatFechaInicio(asignacion.seguimiento.fechaInicio);
    }
    if (progress.status === 'completada') {
      return 'Horas estimadas completadas';
    }
    return `${progress.horasCompletadas} / ${asignacion.seguimiento.horasTotales} h estimadas`;
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

  protected formatFechaInicio(value: string | null | undefined): string {
    if (!value) return '';
    const [y, m, d] = value.split('-').map(Number);
    if (!y || !m || !d) return value;
    return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  protected locationLabel(asignacion: AlumnoAsignacionActual): string {
    const { localidad, region } = asignacion.ubicacion;
    if (localidad && region) return `${localidad}, ${region}`;
    return localidad || region || 'Ubicacion no disponible';
  }

  protected compensationLabel(asignacion: AlumnoAsignacionActual): string {
    const seguimiento = asignacion.seguimiento;
    if (!seguimiento.remunerada) {
      return 'No remuneradas';
    }
    if (seguimiento.importeMensual == null) {
      return 'Remuneradas';
    }
    return `${this.formatImporte(seguimiento.importeMensual)} / mes`;
  }

  protected formatImporte(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
    }).format(value);
  }

  protected initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'A';
  }

  protected canEditPhoto(user: AuthenticatedUser): boolean {
    if (user.roles.includes('ALUMNO')) {
      return this.alumnoPreferencesEditing();
    }
    return this.isStaff(user);
  }

  protected isStaff(user: AuthenticatedUser | null): boolean {
    if (!user) return false;
    return user.roles.includes('TUTOR_CENTRO') || user.roles.includes('COORDINADOR');
  }

  protected openPhotoPicker(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const user = this.user();
    if (user && this.isStaff(user)) {
      document
        .querySelector<HTMLInputElement>('input[type="file"].staff-photo-input')
        ?.click();
      return;
    }
    document
      .querySelector<HTMLInputElement>('app-preferencias-alumno-page input[type="file"].visually-hidden-file')
      ?.click();
  }

  protected onStaffPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;
    input.value = '';
    if (!file || this.photoUploading()) {
      return;
    }

    this.photoUploading.set(true);
    this.photoUploadError.set(null);
    this.userPhotoService
      .uploadPhoto(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.profilePhotoDataUrl.set(response.photoDataUrl);
          this.photoUploading.set(false);
        },
        error: (error: unknown) => {
          this.photoUploadError.set(photoUploadErrorMessage(error));
          this.photoUploading.set(false);
        },
      });
  }

  protected logout(): void {
    this.authService.logout();
    this.user.set(null);
    this.profilePhotoDataUrl.set(null);
    this.alumnoAssignment.set(null);
    this.assignmentStatus.set('idle');
    this.status.set('not-authenticated');
    this.router.navigateByUrl('/login');
  }

  private loadAlumnoAssignment(user: AuthenticatedUser): void {
    if (!user.roles.includes('ALUMNO')) {
      this.alumnoAssignment.set(null);
      this.assignmentStatus.set('idle');
      return;
    }

    this.assignmentStatus.set('loading');
    this.assignmentErrorMessage.set(null);
    this.alumnoAsignacionService
      .getMine()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (assignment) => {
          this.alumnoAssignment.set(assignment);
          this.assignmentStatus.set('loaded');
        },
        error: (error: unknown) => {
          this.alumnoAssignment.set(null);
          this.assignmentErrorMessage.set(assignmentErrorMessage(error));
          this.assignmentStatus.set('error');
        },
      });
  }

  private loadAlumnoPhoto(user: AuthenticatedUser): void {
    if (user.roles.includes('ALUMNO')) {
      const cached = this.preferenciasCache.get();
      if (cached) {
        this.profilePhotoDataUrl.set(cached.photoDataUrl);
        return;
      }

      this.preferenciasService
        .getMine()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (preferences) => {
            this.preferenciasCache.set(preferences);
            this.profilePhotoDataUrl.set(preferences.photoDataUrl);
          },
          error: () => {
            this.profilePhotoDataUrl.set(null);
          },
        });
      return;
    }

    if (this.isStaff(user)) {
      this.userPhotoService
        .getMine()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.profilePhotoDataUrl.set(response.photoDataUrl);
          },
          error: () => {
            this.profilePhotoDataUrl.set(null);
          },
        });
      return;
    }

    this.profilePhotoDataUrl.set(null);
  }
}

const ROLE_LABELS: Record<UserRole, string> = {
  ALUMNO: 'Alumno',
  EMPRESA: 'Empresa',
  TUTOR_CENTRO: 'Tutor centro',
  COORDINADOR: 'Coordinador',
  ADMIN: 'Administración',
};

function isUnauthorized(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 401;
}

function photoUploadErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No se pudo contactar con el servidor.';
    }
    if (error.status === 400) {
      return typeof error.error?.message === 'string'
        ? error.error.message
        : 'La foto no es válida.';
    }
    if (error.status === 401 || error.status === 403) {
      return 'Tu sesión no permite actualizar la foto.';
    }
  }
  return 'No se pudo actualizar la foto. Inténtalo de nuevo.';
}

function assignmentErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No se pudo contactar con el servidor.';
    }
    if (error.status === 401 || error.status === 403) {
      return 'Tu sesion no permite consultar la asignacion de practicas.';
    }
  }
  return 'No se pudo completar la carga de tus practicas actuales.';
}

function profileErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No se pudo contactar con el servidor. Comprueba que el backend esté disponible.';
    }

    if (error.status === 404) {
      return 'No se encontró la información de tu perfil en la sesión actual.';
    }
  }

  return 'No se pudo completar la carga del perfil. Inténtalo de nuevo.';
}
