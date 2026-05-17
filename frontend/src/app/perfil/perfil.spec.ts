import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, Output, PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AlumnoAsignacionActual } from '../alumnos/asignacion-actual.models';
import { AlumnoAsignacionActualService } from '../alumnos/asignacion-actual.service';
import { PreferenciasAlumnoPage } from '../alumnos/preferencias';
import { AuthenticatedUser, UserRole } from '../auth/auth.models';
import { AuthService } from '../auth/auth.service';
import { EmpresaPerfilPage } from '../empresas/empresa-perfil';
import { AlumnoPreferencias } from '../alumnos/preferencias.models';
import { AlumnoPreferenciasService } from '../alumnos/preferencias.service';
import { PerfilPage } from './perfil';

@Component({
  selector: 'app-preferencias-alumno-page',
  template: '',
})
class PreferenciasAlumnoStub {
  @Input() embedded = false;
  @Input() showPhoto = true;
  @Output() editingChange = new EventEmitter<boolean>();
  @Output() photoChange = new EventEmitter<string | null>();
}

@Component({
  selector: 'app-empresa-perfil-page',
  template: '',
})
class EmpresaPerfilStub {
  @Input() embedded = false;
}

describe('PerfilPage', () => {
  let fixture: ComponentFixture<PerfilPage>;
  let authService: jasmine.SpyObj<AuthService>;
  let preferenciasService: jasmine.SpyObj<AlumnoPreferenciasService>;
  let asignacionService: jasmine.SpyObj<AlumnoAsignacionActualService>;
  let navigateSpy: jasmine.Spy;

  const samplePreferences: AlumnoPreferencias = {
    familiaProfesional: 'Informática y comunicaciones',
    cicloFormativo: 'Desarrollo de Aplicaciones Web',
    localidadPreferida: 'Valencia',
    modalidadPreferida: 'HIBRIDA',
    fechaDisponibilidad: '2026-09-15',
    observaciones: 'Preferencia por desarrollo web.',
    hasCv: true,
    cvFileName: 'cv-alumno.pdf',
    cvContentType: 'application/pdf',
    cvSize: 2048,
    cvUpdatedAt: '2026-05-07T12:00:00Z',
    hasPhoto: true,
    photoDataUrl: 'data:image/png;base64,aW1n',
    photoContentType: 'image/png',
    photoSize: 1024,
    photoUpdatedAt: '2026-05-08T12:00:00Z',
  };

  const sampleAssignment: AlumnoAsignacionActual = {
    id: 14,
    origen: 'INTERNA',
    estado: 'ACTIVA',
    fechaAsignacion: '2026-05-09T12:00:00Z',
    observaciones: 'Incorporacion confirmada por tutoria.',
    oferta: {
      id: 4,
      titulo: 'Practicas DAW',
    },
    empresa: {
      id: 3,
      nombre: 'Tech Norte Formacion',
    },
    ubicacion: {
      localidad: 'Valencia',
      region: 'Valencia',
    },
    urlAplicacion: '/practicas/4',
    seguimiento: {
      horasTotales: 400,
      fechaInicio: '2026-05-04',
      horasDiariasEstimadas: 7,
      remunerada: true,
      importeMensual: 350,
      observacionesRetribucion: 'Beca mensual.',
    },
  };

  function buildUser(roles: UserRole[]): AuthenticatedUser {
    return {
      id: 8,
      email: 'demo@example.com',
      displayName: 'Demo Usuario',
      roles,
    };
  }

  async function configure({
    accessToken = 'jwt-token',
    result = of(buildUser(['ALUMNO', 'ADMIN'])),
    assignmentResult = of(sampleAssignment),
    platformId = 'browser',
  }: {
    accessToken?: string | null;
    result?: Observable<AuthenticatedUser>;
    assignmentResult?: Observable<AlumnoAsignacionActual | null>;
    platformId?: string;
  } = {}): Promise<void> {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'accessToken',
      'loadAuthenticatedUser',
      'logout',
    ]);
    authService.accessToken.and.returnValue(accessToken);
    authService.loadAuthenticatedUser.and.returnValue(result as never);
    preferenciasService = jasmine.createSpyObj<AlumnoPreferenciasService>(
      'AlumnoPreferenciasService',
      ['getMine'],
    );
    preferenciasService.getMine.and.returnValue(of(samplePreferences));
    asignacionService = jasmine.createSpyObj<AlumnoAsignacionActualService>(
      'AlumnoAsignacionActualService',
      ['getMine'],
    );
    asignacionService.getMine.and.returnValue(assignmentResult);

    TestBed.configureTestingModule({
      imports: [PerfilPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: AlumnoPreferenciasService, useValue: preferenciasService },
        { provide: AlumnoAsignacionActualService, useValue: asignacionService },
        { provide: PLATFORM_ID, useValue: platformId },
      ],
    });
    TestBed.overrideComponent(PerfilPage, {
      remove: { imports: [EmpresaPerfilPage, PreferenciasAlumnoPage] },
      add: { imports: [EmpresaPerfilStub, PreferenciasAlumnoStub] },
    });
    await TestBed.compileComponents();

    const router = TestBed.inject(Router);
    navigateSpy = spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));

    fixture = TestBed.createComponent(PerfilPage);
  }

  it('should render the authenticated user profile', async () => {
    await configure();

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(authService.loadAuthenticatedUser).toHaveBeenCalled();
    expect(compiled.textContent).toContain('Demo Usuario');
    expect(compiled.textContent).toContain('demo@example.com');
    expect(compiled.textContent).toContain('Alumno');
    expect(compiled.textContent).toContain('Administración');
    expect(compiled.textContent).toContain('no se editan desde este formulario');
    expect(compiled.querySelector<HTMLImageElement>('.profile-avatar img')?.src).toContain(
      samplePreferences.photoDataUrl,
    );
  });

  it('should render the current FCT assignment for an ALUMNO user', async () => {
    await configure({ result: of(buildUser(['ALUMNO'])) });

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(asignacionService.getMine).toHaveBeenCalled();
    expect(compiled.textContent).toContain('Practicas actuales');
    expect(compiled.textContent).toContain('Tech Norte Formacion');
    expect(compiled.textContent).toContain('Practicas DAW');
    expect(compiled.textContent).toContain('400 h');
    expect(compiled.textContent).toContain('350');
    expect(compiled.querySelector<HTMLAnchorElement>('.assignment-link')?.getAttribute('href')).toBe(
      '/practicas/4',
    );
  });

  it('should omit the assignment panel when the ALUMNO user has no active assignment', async () => {
    await configure({
      result: of(buildUser(['ALUMNO'])),
      assignmentResult: of(null),
    });

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(asignacionService.getMine).toHaveBeenCalled();
    expect(compiled.querySelector('.student-assignment-panel')).toBeNull();
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

  it('should expose a logout button when the profile is loaded', async () => {
    await configure();

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector<HTMLButtonElement>('button.logout-action');
    expect(button).not.toBeNull();
    expect(button?.textContent?.trim()).toBe('Cerrar sesión');
  });

  it('should clear the session and redirect to /login when logout is clicked', async () => {
    await configure();

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector<HTMLButtonElement>('button.logout-action');
    button?.click();
    fixture.detectChanges();

    expect(authService.logout).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith('/login');
    expect(compiled.textContent).toContain('Inicia sesión para ver tu perfil');
  });

  it('should embed the preferencias section for an ALUMNO user', async () => {
    await configure({ result: of(buildUser(['ALUMNO'])) });

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-preferencias-alumno-page')).not.toBeNull();
    expect(compiled.querySelector('app-empresa-perfil-page')).toBeNull();
    expect(compiled.querySelector('section[aria-label="Datos editables del alumno"]')).not.toBeNull();
  });

  it('should enable photo editing when alumno preferences enter edit mode', async () => {
    await configure({ result: of(buildUser(['ALUMNO'])) });

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const preferencias = compiled.querySelector('app-preferencias-alumno-page') as HTMLElement;
    expect(compiled.querySelector('.profile-avatar-button.is-editable')).toBeNull();

    preferencias.dispatchEvent(new CustomEvent('editingChange', { detail: true }));
    fixture.detectChanges();

    expect(compiled.querySelector('.profile-avatar-button.is-editable')).not.toBeNull();
    expect(compiled.querySelector('.photo-edit-icon')).not.toBeNull();
  });

  it('should embed the empresa perfil section for an EMPRESA user', async () => {
    await configure({ result: of(buildUser(['EMPRESA'])) });

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-empresa-perfil-page')).not.toBeNull();
    expect(compiled.querySelector('app-preferencias-alumno-page')).toBeNull();
    expect(compiled.querySelector('section[aria-label="Perfil de empresa"]')).not.toBeNull();
  });

  it('should embed both sections for a user with ALUMNO and EMPRESA roles', async () => {
    await configure({ result: of(buildUser(['ALUMNO', 'EMPRESA'])) });

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-preferencias-alumno-page')).not.toBeNull();
    expect(compiled.querySelector('app-empresa-perfil-page')).not.toBeNull();
  });

  it('should not embed role sections for users without ALUMNO or EMPRESA roles', async () => {
    await configure({ result: of(buildUser(['TUTOR_CENTRO'])) });

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-preferencias-alumno-page')).toBeNull();
    expect(compiled.querySelector('app-empresa-perfil-page')).toBeNull();
  });
});
