import { HttpErrorResponse } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { LoginResponse } from './auth.models';
import { AuthService } from './auth.service';
import { LoginPage } from './login';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let authService: jasmine.SpyObj<Pick<AuthService, 'login'>>;
  let router: Router;

  const loginResponse: LoginResponse = {
    tokenType: 'Bearer',
    accessToken: 'jwt-token',
    expiresAt: '2026-05-04T12:00:00Z',
    user: {
      id: 1,
      email: 'alumno@example.com',
      displayName: 'Alumno Demo',
      roles: ['ALUMNO'],
    },
  };

  beforeEach(async () => {
    authService = jasmine.createSpyObj<Pick<AuthService, 'login'>>('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should keep submit disabled until required credentials are valid', () => {
    const button = submitButton();

    expect(button.disabled).toBeTrue();

    setInputValue('#login-email', 'alumno@example.com');
    setInputValue('#login-password', 'CorrectPassword123!');
    fixture.detectChanges();

    expect(button.disabled).toBeFalse();
  });

  it('should call auth service and navigate to profile after a valid login', () => {
    authService.login.and.returnValue(of(loginResponse));
    spyOn(router, 'navigateByUrl').and.resolveTo(true);

    setInputValue('#login-email', 'alumno@example.com');
    setInputValue('#login-password', 'CorrectPassword123!');
    submitForm();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'alumno@example.com',
      password: 'CorrectPassword123!',
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/perfil');
  });

  it('should show a clear error when credentials are rejected', () => {
    authService.login.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 401 })) as Observable<LoginResponse>,
    );

    setInputValue('#login-email', 'alumno@example.com');
    setInputValue('#login-password', 'wrong-password');
    submitForm();

    expect(alertText()).toContain('El email o la contraseña no son correctos.');
  });

  function setInputValue(selector: string, value: string): void {
    const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function submitButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
  }

  function submitForm(): void {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  function alertText(): string {
    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    return alert.textContent?.trim() ?? '';
  }
});
