import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthenticatedUser, UserRole } from '../auth/auth.models';
import { AuthService } from '../auth/auth.service';
import { AppNavigation } from './app-navigation';

describe('AppNavigation', () => {
  function configure(roles: UserRole[] | null) {
    const user = roles
      ? ({ id: 1, email: 'demo@example.com', displayName: 'Demo', roles } as AuthenticatedUser)
      : null;
    const currentUser = signal<AuthenticatedUser | null>(user);

    TestBed.configureTestingModule({
      imports: [AppNavigation],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthService, useValue: { currentUser } },
      ],
    });
  }

  function renderLabels(): { labels: string[]; hrefs: string[] } {
    const fixture = TestBed.createComponent(AppNavigation);
    fixture.detectChanges();
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];
    return {
      labels: links.map((link) => link.textContent?.trim() ?? ''),
      hrefs: links.map((link) => link.getAttribute('href') ?? ''),
    };
  }

  it('should render the base routes when there is no active session', () => {
    configure(null);

    const { labels, hrefs } = renderLabels();

    expect(labels).toEqual([
      'FCTNow',
      'Inicio',
      'Prácticas',
      'Mensajes',
      'Notificaciones',
      'Perfil',
    ]);
    expect(hrefs).toEqual([
      '/',
      '/',
      '/practicas',
      '/mensajes',
      '/notificaciones',
      '/perfil',
    ]);
  });

  it('should expose the alumno applications link only when the user has the ALUMNO role', () => {
    configure(['ALUMNO']);

    const { labels, hrefs } = renderLabels();

    expect(labels).toContain('Mis solicitudes');
    expect(labels).toContain('Preferencias');
    expect(hrefs).toContain('/alumno/solicitudes');
    expect(hrefs).toContain('/alumno/preferencias');
  });

  it('should hide the alumno applications link for users without the ALUMNO role', () => {
    configure(['EMPRESA']);

    const { labels, hrefs } = renderLabels();

    expect(labels).not.toContain('Mis solicitudes');
    expect(labels).not.toContain('Preferencias');
    expect(hrefs).not.toContain('/alumno/solicitudes');
    expect(hrefs).not.toContain('/alumno/preferencias');
  });

  it('should expose the empresa links only when the user has the EMPRESA role', () => {
    configure(['EMPRESA']);

    const { labels, hrefs } = renderLabels();

    expect(labels).toContain('Mis ofertas');
    expect(labels).toContain('Perfil empresa');
    expect(hrefs).toContain('/empresa/ofertas');
    expect(hrefs).toContain('/empresa/perfil');
  });

  it('should hide the empresa links for users without the EMPRESA role', () => {
    configure(['ALUMNO']);

    const { labels, hrefs } = renderLabels();

    expect(labels).not.toContain('Mis ofertas');
    expect(labels).not.toContain('Perfil empresa');
    expect(hrefs).not.toContain('/empresa/ofertas');
    expect(hrefs).not.toContain('/empresa/perfil');
  });

  it('should expose the empresa applications link only when the user has the EMPRESA role', () => {
    configure(['EMPRESA']);

    const { labels, hrefs } = renderLabels();

    expect(labels).toContain('Solicitudes recibidas');
    expect(hrefs).toContain('/empresa/solicitudes');
  });

  it('should hide the empresa applications link for users without the EMPRESA role', () => {
    configure(['ALUMNO']);

    const { labels, hrefs } = renderLabels();

    expect(labels).not.toContain('Solicitudes recibidas');
    expect(hrefs).not.toContain('/empresa/solicitudes');
  });

  it('should expose the asignaciones link for tutor centro', () => {
    configure(['TUTOR_CENTRO']);

    const { labels, hrefs } = renderLabels();

    expect(labels).toContain('Asignaciones');
    expect(hrefs).toContain('/asignaciones');
  });

  it('should expose the asignaciones link for coordinador', () => {
    configure(['COORDINADOR']);

    const { labels, hrefs } = renderLabels();

    expect(labels).toContain('Asignaciones');
    expect(hrefs).toContain('/asignaciones');
  });

  it('should hide the asignaciones link for users without centro roles', () => {
    configure(['ALUMNO']);

    const { labels, hrefs } = renderLabels();

    expect(labels).not.toContain('Asignaciones');
    expect(hrefs).not.toContain('/asignaciones');
  });
});
