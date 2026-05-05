import { HttpErrorResponse } from '@angular/common/http';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AuthenticatedUser } from '../auth/auth.models';
import { AuthService } from '../auth/auth.service';
import { PerfilPage } from './perfil';

describe('PerfilPage', () => {
  let fixture: ComponentFixture<PerfilPage>;
  let authService: jasmine.SpyObj<AuthService>;

  const user: AuthenticatedUser = {
    id: 8,
    email: 'alumno@example.com',
    displayName: 'Alumno Demo',
    roles: ['ALUMNO', 'ADMIN'],
  };

  async function configure({
    accessToken = 'jwt-token',
    result = of(user),
    platformId = 'browser',
  }: {
    accessToken?: string | null;
    result?: Observable<AuthenticatedUser>;
    platformId?: string;
  } = {}): Promise<void> {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['accessToken', 'loadAuthenticatedUser']);
    authService.accessToken.and.returnValue(accessToken);
    authService.loadAuthenticatedUser.and.returnValue(result as never);

    await TestBed.configureTestingModule({
      imports: [PerfilPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: PLATFORM_ID, useValue: platformId },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilPage);
  }

  it('should render the authenticated user profile', async () => {
    await configure();

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(authService.loadAuthenticatedUser).toHaveBeenCalled();
    expect(compiled.textContent).toContain('Alumno Demo');
    expect(compiled.textContent).toContain('alumno@example.com');
    expect(compiled.textContent).toContain('Alumno');
    expect(compiled.textContent).toContain('Administración');
    expect(compiled.textContent).toContain('Alumno, Administración');
  });

  it('should render the not authenticated state when there is no session', async () => {
    await configure({ accessToken: null });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(authService.loadAuthenticatedUser).not.toHaveBeenCalled();
    expect(compiled.textContent).toContain('Inicia sesión para ver tu perfil');

    const loginLink = compiled.querySelector<HTMLAnchorElement>('.back-link');
    expect(loginLink?.getAttribute('href')).toBe('/login');
  });

  it('should render the error state when loading the profile fails', async () => {
    await configure({
      result: throwError(() => new HttpErrorResponse({ status: 0 })),
    });

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No se pudo cargar tu perfil');
    expect(compiled.textContent).toContain('backend esté disponible');
  });

  it('should render the not authenticated state for a 401 response', async () => {
    await configure({
      result: throwError(() => new HttpErrorResponse({ status: 401 })),
    });

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Inicia sesión para ver tu perfil');
  });

  it('should avoid calling the backend during server rendering', async () => {
    await configure({ platformId: 'server' });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(authService.loadAuthenticatedUser).not.toHaveBeenCalled();
    expect(compiled.textContent).toContain('Inicia sesión para ver tu perfil');
  });
});
