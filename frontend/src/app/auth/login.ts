import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  template: `
    <main class="page-shell route-page login-page">
      <header class="route-hero login-hero">
        <p class="eyebrow">Acceso</p>
        <h1>Entrada a FCTNow</h1>
        <p>
          Inicia sesión con tu cuenta de alumno, empresa, tutor de centro, coordinación o
          administración.
        </p>
      </header>

      <section class="route-panel login-panel" aria-labelledby="login-title">
        <div class="login-copy">
          <p class="eyebrow">Credenciales</p>
          <h2 id="login-title">Accede a tu espacio FCT</h2>
          <p>
            Usa las credenciales asignadas por el centro para continuar con la gestión de prácticas,
            solicitudes, seguimiento y evaluación.
          </p>
        </div>

        <form class="login-form" [formGroup]="loginForm" (ngSubmit)="submit()" novalidate>
          <div class="form-field">
            <label for="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              formControlName="email"
              autocomplete="email"
              inputmode="email"
              [attr.aria-invalid]="showEmailError()"
              aria-describedby="login-email-error"
              (input)="clearSubmitError()"
            />
            @if (showEmailError()) {
              <p class="field-error" id="login-email-error">{{ emailErrorMessage() }}</p>
            }
          </div>

          <div class="form-field">
            <label for="login-password">Contraseña</label>
            <input
              id="login-password"
              type="password"
              formControlName="password"
              autocomplete="current-password"
              [attr.aria-invalid]="showPasswordError()"
              aria-describedby="login-password-error"
              (input)="clearSubmitError()"
            />
            @if (showPasswordError()) {
              <p class="field-error" id="login-password-error">
                Introduce la contraseña de tu cuenta.
              </p>
            }
          </div>

          @if (submitError()) {
            <p class="form-alert" role="alert">{{ submitError() }}</p>
          }

          <button class="login-submit" type="submit" [disabled]="loginForm.invalid || isSubmitting()">
            @if (isSubmitting()) {
              Accediendo...
            } @else {
              Acceder
            }
          </button>
        </form>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected submit(): void {
    this.submitError.set(null);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.authService
      .login(this.loginForm.getRawValue())
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
        }),
      )
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/perfil');
        },
        error: (error: unknown) => {
          this.submitError.set(loginErrorMessage(error));
        },
      });
  }

  protected clearSubmitError(): void {
    if (this.submitError()) {
      this.submitError.set(null);
    }
  }

  protected showEmailError(): boolean {
    const control = this.loginForm.controls.email;
    return control.invalid && (control.touched || control.dirty);
  }

  protected emailErrorMessage(): string {
    const control = this.loginForm.controls.email;

    if (control.hasError('required')) {
      return 'Introduce el email de tu cuenta.';
    }

    return 'Introduce un email válido.';
  }

  protected showPasswordError(): boolean {
    const control = this.loginForm.controls.password;
    return control.invalid && (control.touched || control.dirty);
  }
}

function loginErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 401) {
      return 'El email o la contraseña no son correctos.';
    }

    if (error.status === 400) {
      return 'Revisa el email y la contraseña antes de acceder.';
    }

    if (error.status === 0) {
      return 'No se pudo contactar con el servidor. Comprueba que el backend esté disponible.';
    }
  }

  return 'No se pudo completar el acceso. Inténtalo de nuevo.';
}
