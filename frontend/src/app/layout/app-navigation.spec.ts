import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthenticatedUser, UserRole } from '../auth/auth.models';
import { AuthService } from '../auth/auth.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
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
        {
          provide: NotificacionesService,
          useValue: {
            unreadCount: signal(0).asReadonly(),
            refreshMine: () => undefined,
            clearMine: () => undefined,
          },
        },
      ],
    });
  }

  function renderLabels(): { labels: string[]; hrefs: string[] } {
    const fixture = TestBed.createComponent(AppNavigation);
    fixture.detectChanges();
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];
    return {
      labels: links.map((link) => link.textContent?.trim().replace(/\s+/g, ' ') ?? ''),
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
      'Perfil',
    ]);
    expect(hrefs).toEqual([
      '/',
      '/',
      '/practicas',
      '/perfil',
    ]);
  });

  it('should expose the alumno applications link only when the user has the ALUMNO role', () => {
    configure(['ALUMNO']);

    const { labels, hrefs } = renderLabels();

    expect(labels).toContain('Mis solicitudes');
    expect(hrefs).toContain('/alumno/solicitudes');
  });

  it('should hide the alumno applications link for users without the ALUMNO role', () => {
    configure(['EMPRESA']);

    const { labels, hrefs } = renderLabels();

    expect(labels).not.toContain('Mis solicitudes');
    expect(hrefs).not.toContain('/alumno/solicitudes');
  });

  it('should expose the empresa links only when the user has the EMPRESA role', () => {
    configure(['EMPRESA']);

    const { labels, hrefs } = renderLabels();

    expect(labels).toContain('Mis ofertas');
    expect(hrefs).toContain('/empresa/ofertas');
  });

  it('should hide the empresa links for users without the EMPRESA role', () => {
    configure(['ALUMNO']);

    const { labels, hrefs } = renderLabels();

    expect(labels).not.toContain('Mis ofertas');
    expect(hrefs).not.toContain('/empresa/ofertas');
  });

  it('should not expose the obsolete preferencias and empresa-perfil entries', () => {
    configure(['ALUMNO', 'EMPRESA']);

    const { labels, hrefs } = renderLabels();

    expect(labels).not.toContain('Preferencias');
    expect(labels).not.toContain('Perfil empresa');
    expect(hrefs).not.toContain('/alumno/preferencias');
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

  it('should hide the asignaciones link for tutor centro', () => {
    configure(['TUTOR_CENTRO']);

    const { labels, hrefs } = renderLabels();

    expect(labels).not.toContain('Asignaciones');
    expect(hrefs).not.toContain('/asignaciones');
  });

  it('should expose the tutor panel link for tutor centro', () => {
    configure(['TUTOR_CENTRO']);

    const { labels, hrefs } = renderLabels();

    expect(labels).toContain('Panel tutor');
    expect(hrefs).toContain('/tutor');
  });

  it('should expose the tutor panel link for coordinador', () => {
    configure(['COORDINADOR']);

    const { labels, hrefs } = renderLabels();

    expect(labels).toContain('Panel tutor');
    expect(hrefs).toContain('/tutor');
  });

  it('should hide the tutor panel link for users without centro roles', () => {
    configure(['ALUMNO']);

    const { labels, hrefs } = renderLabels();

    expect(labels).not.toContain('Panel tutor');
    expect(hrefs).not.toContain('/tutor');
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

  it('should render an icon for every navigation link', () => {
    configure(['ALUMNO', 'EMPRESA', 'TUTOR_CENTRO']);

    const fixture = TestBed.createComponent(AppNavigation);
    fixture.detectChanges();

    const navLinks = Array.from(
      fixture.nativeElement.querySelectorAll('.app-nav-link'),
    ) as HTMLElement[];

    expect(navLinks.length).toBeGreaterThan(0);
    navLinks.forEach((link) => {
      const icon = link.querySelector('.app-nav-icon svg');
      const label = link.querySelector('.app-nav-label');
      expect(icon).withContext('each nav link should expose an inline SVG icon').not.toBeNull();
      expect(label?.textContent?.trim()).withContext('each nav link should keep a text label').toBeTruthy();
    });
  });

  it('should render a notification badge when there are unread notifications', () => {
    const currentUser = signal<AuthenticatedUser | null>({
      id: 1,
      email: 'alumno@example.com',
      displayName: 'Alumno',
      roles: ['ALUMNO'],
    } as AuthenticatedUser);
    const unreadCount = signal(3);

    TestBed.configureTestingModule({
      imports: [AppNavigation],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthService, useValue: { currentUser } },
        {
          provide: NotificacionesService,
          useValue: {
            unreadCount: unreadCount.asReadonly(),
            refreshMine: () => undefined,
            clearMine: () => undefined,
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(AppNavigation);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.notification-badge') as HTMLElement;
    expect(badge).not.toBeNull();
    expect(badge.textContent?.trim()).toBe('3');
  });

  it('should not render the notification badge for non alumno users', () => {
    const currentUser = signal<AuthenticatedUser | null>({
      id: 2,
      email: 'tutor@example.com',
      displayName: 'Tutor',
      roles: ['TUTOR_CENTRO'],
    } as AuthenticatedUser);
    const unreadCount = signal(3);

    TestBed.configureTestingModule({
      imports: [AppNavigation],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthService, useValue: { currentUser } },
        {
          provide: NotificacionesService,
          useValue: {
            unreadCount: unreadCount.asReadonly(),
            refreshMine: () => undefined,
            clearMine: () => undefined,
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(AppNavigation);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.notification-badge')).toBeNull();
  });

  it('should expose a collapsed menu toggle with the expected ARIA attributes', () => {
    configure(null);

    const fixture = TestBed.createComponent(AppNavigation);
    fixture.detectChanges();

    const toggle = fixture.nativeElement.querySelector('.app-nav-toggle') as HTMLButtonElement;
    expect(toggle).not.toBeNull();
    expect(toggle.getAttribute('aria-controls')).toBe('app-nav');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const header = fixture.nativeElement.querySelector('.app-header') as HTMLElement;
    expect(header.classList.contains('is-menu-open')).toBeTrue();
  });

  it('should close the collapsed menu after activating a navigation link', () => {
    configure(null);

    const fixture = TestBed.createComponent(AppNavigation);
    fixture.detectChanges();

    const toggle = fixture.nativeElement.querySelector('.app-nav-toggle') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();

    const firstNavLink = fixture.nativeElement.querySelector('.app-nav-link') as HTMLAnchorElement;
    firstNavLink.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    const header = fixture.nativeElement.querySelector('.app-header') as HTMLElement;
    expect(header.classList.contains('is-menu-open')).toBeFalse();
  });

  it('should toggle the scrolled class when the window scrolls past the threshold', () => {
    configure(null);

    const fixture = TestBed.createComponent(AppNavigation);
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('.app-header') as HTMLElement;
    expect(header.classList.contains('is-scrolled')).toBeFalse();

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 240 });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    expect(header.classList.contains('is-scrolled')).toBeTrue();

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    expect(header.classList.contains('is-scrolled')).toBeFalse();
  });
});
