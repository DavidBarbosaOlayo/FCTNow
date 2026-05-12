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
import { PreferenciasAlumnoPage } from '../alumnos/preferencias';
import { AuthenticatedUser, UserRole } from '../auth/auth.models';
import { AuthService } from '../auth/auth.service';
import { EmpresaPerfilPage } from '../empresas/empresa-perfil';

type ProfileStatus = 'loading' | 'loaded' | 'error' | 'not-authenticated';

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
          <a class="back-link" routerLink="/login">Ir al acceso</a>
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
            <div class="profile-copy">
              <p class="eyebrow">Sesión activa</p>
              <h2 id="profile-title">{{ user.displayName }}</h2>
              <p>{{ user.email }}</p>
            </div>

            <div class="role-cloud" aria-label="Roles de usuario">
              @for (role of user.roles; track role) {
                <span>{{ roleLabel(role) }}</span>
              }
            </div>
          </div>

          <dl class="profile-details" aria-label="Datos básicos del perfil">
            <div>
              <dt>Nombre visible</dt>
              <dd>{{ user.displayName }}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{{ user.email }}</dd>
            </div>
            <div>
              <dt>Rol o roles</dt>
              <dd>{{ rolesText(user.roles) }}</dd>
            </div>
          </dl>

          <div class="profile-actions">
            <button type="button" class="logout-action" (click)="logout()">
              Cerrar sesión
            </button>
          </div>
        </section>

        @if (user.roles.includes('ALUMNO')) {
          <section class="profile-role-section" aria-label="Preferencias del alumno">
            <app-preferencias-alumno-page [embedded]="true" />
          </section>
        }

        @if (user.roles.includes('EMPRESA')) {
          <section class="profile-role-section" aria-label="Perfil de empresa">
            <app-empresa-perfil-page [embedded]="true" />
          </section>
        }
      }
    </main>
  `,
  styles: [
    `
      .profile-page {
        align-content: start;
        gap: 1rem;
        padding-top: 2rem;
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
        background: rgba(255, 246, 241, 0.9);
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
        gap: 1rem;
        padding: 1.1rem;
      }

      .profile-summary {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 1rem;
        align-items: start;
      }

      .profile-copy p:not(.eyebrow),
      .profile-details dd {
        margin: 0.35rem 0 0;
        color: var(--muted);
        line-height: 1.6;
      }

      .role-cloud {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 0.5rem;
      }

      .role-cloud span {
        min-height: 2rem;
        display: inline-flex;
        align-items: center;
        padding: 0 0.75rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        color: var(--ink);
        background: rgba(255, 255, 255, 0.6);
        font-size: 0.88rem;
        font-weight: 800;
      }

      .profile-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .logout-action {
        min-height: 2.5rem;
        padding: 0 0.95rem;
        border: 1px solid rgba(179, 38, 30, 0.4);
        border-radius: var(--radius-md);
        background: rgba(255, 246, 241, 0.92);
        color: #8a3a25;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
      }

      .logout-action:hover,
      .logout-action:focus-visible {
        border-color: rgba(179, 38, 30, 0.65);
        outline: none;
      }

      .profile-details {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.85rem;
        margin: 0;
      }

      .profile-details div {
        min-width: 0;
        padding: 0.85rem;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: rgba(255, 255, 255, 0.52);
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

      .profile-role-section {
        display: grid;
        gap: 1rem;
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
        background: rgba(255, 255, 255, 0.62);
        font-weight: 800;
        text-decoration: none;
      }

      .back-link:hover,
      .back-link:focus-visible {
        border-color: rgba(17, 78, 74, 0.36);
        outline: none;
      }

      @media (max-width: 820px) {
        .profile-summary,
        .profile-details {
          grid-template-columns: 1fr;
        }

        .role-cloud {
          justify-content: flex-start;
        }
      }

      @media (max-width: 620px) {
        .profile-page {
          padding-top: 1rem;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  protected readonly status = signal<ProfileStatus>('loading');
  protected readonly user = signal<AuthenticatedUser | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.status.set('not-authenticated');
      return;
    }

    if (!this.authService.accessToken()) {
      this.status.set('not-authenticated');
      return;
    }

    this.status.set('loading');
    this.errorMessage.set(null);

    this.authService
      .loadAuthenticatedUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.user.set(user);
          this.status.set('loaded');
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

  protected logout(): void {
    this.authService.logout();
    this.user.set(null);
    this.status.set('not-authenticated');
    this.router.navigateByUrl('/login');
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
