import { HttpErrorResponse } from '@angular/common/http';
import { PLATFORM_ID, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { TutorAlumnosService } from '../fct/tutor-alumnos.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { OfertaFct } from './ofertas.models';
import { OfertasService } from './ofertas.service';
import { OfertaDetailPage } from './oferta-detail';
import { SolicitudFct } from './solicitudes.models';
import { SolicitudesService } from './solicitudes.service';

describe('OfertaDetailPage', () => {
  let fixture: ComponentFixture<OfertaDetailPage>;
  let ofertasService: jasmine.SpyObj<OfertasService>;
  let solicitudesService: jasmine.SpyObj<SolicitudesService>;

  const offer: OfertaFct = {
    id: 34,
    empresaId: 15,
    empresaNombre: 'Tech Norte Formacion',
    titulo: 'Practicas de desarrollo web',
    descripcion: 'Apoyo al equipo de desarrollo en aplicaciones internas.',
    familiaProfesional: 'Informatica y comunicaciones',
    cicloFormativo: 'Desarrollo de Aplicaciones Web',
    localidad: 'Valencia',
    provincia: 'Valencia',
    modalidad: 'PRESENCIAL',
    fechaInicio: '2026-09-15',
    fechaFin: '2026-12-15',
    plazas: 2,
    requisitos: 'Conocimientos basicos de HTML, CSS y TypeScript.',
    tareas: 'Maquetacion, pruebas funcionales y documentacion tecnica.',
    estado: 'PUBLICADA',
    createdAt: '2026-05-04T12:00:00Z',
    updatedAt: '2026-05-04T12:00:00Z',
  };

  async function configure({
    id = '34',
    result = of(offer),
    platformId = 'browser',
    authenticated = true,
    solicitudes = of([]),
  }: {
    id?: string;
    result?: Observable<OfertaFct>;
    platformId?: string;
    authenticated?: boolean;
    solicitudes?: Observable<SolicitudFct[]>;
  } = {}): Promise<void> {
    ofertasService = jasmine.createSpyObj<OfertasService>('OfertasService', ['detail']);
    ofertasService.detail.and.returnValue(result);
    solicitudesService = jasmine.createSpyObj<SolicitudesService>('SolicitudesService', [
      'mine',
      'requestOffer',
    ]);
    solicitudesService.mine.and.returnValue(solicitudes);
    solicitudesService.requestOffer.and.returnValue(
      of({
        id: 1,
        ofertaId: offer.id,
        ofertaTitulo: offer.titulo,
        empresaNombre: offer.empresaNombre,
        estado: 'SOLICITADA',
        createdAt: '2026-05-06T10:00:00Z',
        asignadaPorCentro: false,
        fechaAsignacion: null,
      }),
    );

    await TestBed.configureTestingModule({
      imports: [OfertaDetailPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id })) },
        },
        { provide: OfertasService, useValue: ofertasService },
        { provide: SolicitudesService, useValue: solicitudesService },
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: signal(authenticated),
            accessToken: () => (authenticated ? 'token' : null),
            currentUser: () => null,
          },
        },
        {
          provide: TutorAlumnosService,
          useValue: { list: () => of([]) },
        },
        {
          provide: NotificacionesService,
          useValue: { recomendar: () => of({}) },
        },
        { provide: PLATFORM_ID, useValue: platformId },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OfertaDetailPage);
  }

  it('should render the published offer detail', async () => {
    await configure();

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(ofertasService.detail).toHaveBeenCalledWith(34);
    expect(compiled.textContent).toContain('Oferta FCT publicada');
    expect(compiled.textContent).toContain('Practicas de desarrollo web');
    expect(compiled.textContent).toContain('Tech Norte Formacion');
    expect(compiled.textContent).toContain('Desarrollo de Aplicaciones Web');
    expect(compiled.textContent).toContain('Maquetacion, pruebas funcionales');
    expect(compiled.textContent).toContain('Conocimientos basicos');
    expect(compiled.textContent).toContain('Solicitar oferta');

    const backLink = compiled.querySelector<HTMLAnchorElement>('.back-link');
    expect(backLink?.getAttribute('href')).toBe('/practicas');
  });

  it('should render a login call to action when the user is not authenticated', async () => {
    await configure({ authenticated: false });

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(solicitudesService.mine).not.toHaveBeenCalled();
    expect(compiled.textContent).toContain('Inicia sesion con tu cuenta de alumno');

    const loginLink = compiled.querySelector<HTMLAnchorElement>('.primary-action');
    expect(loginLink?.getAttribute('href')).toBe('/login');
  });

  it('should render requested state when the offer is already applied', async () => {
    await configure({
      solicitudes: of([
        {
          id: 1,
          ofertaId: 34,
          ofertaTitulo: offer.titulo,
          empresaNombre: offer.empresaNombre,
          estado: 'SOLICITADA',
          createdAt: '2026-05-06T10:00:00Z',
          asignadaPorCentro: false,
          fechaAsignacion: null,
        },
      ]),
    });

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(solicitudesService.mine).toHaveBeenCalled();
    expect(compiled.textContent).toContain('Ya has solicitado esta oferta');
  });

  it('should request the offer from the detail action', async () => {
    await configure();

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    compiled.querySelector<HTMLButtonElement>('.primary-action')?.click();
    fixture.detectChanges();

    expect(solicitudesService.requestOffer).toHaveBeenCalledWith(34);
    expect(compiled.textContent).toContain('Ya has solicitado esta oferta');
  });

  it('should treat duplicate application errors as already requested', async () => {
    await configure();
    solicitudesService.requestOffer.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 409 })),
    );

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    compiled.querySelector<HTMLButtonElement>('.primary-action')?.click();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('Ya has solicitado esta oferta');
  });

  it('should render not found for an invalid route id', async () => {
    await configure({ id: 'abc' });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(ofertasService.detail).not.toHaveBeenCalled();
    expect(compiled.textContent).toContain('Oferta no encontrada');
  });

  it('should render not found when the API returns 404', async () => {
    await configure({
      result: throwError(() => new HttpErrorResponse({ status: 404 })),
    });

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(ofertasService.detail).toHaveBeenCalledWith(34);
    expect(compiled.textContent).toContain('Oferta no encontrada');
  });

  it('should render an authentication error state', async () => {
    await configure({
      result: throwError(() => new HttpErrorResponse({ status: 401 })),
    });

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Inicia sesión para consultar el detalle');
  });

  it('should avoid loading the offer during server rendering', async () => {
    await configure({ platformId: 'server' });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(ofertasService.detail).not.toHaveBeenCalled();
    expect(solicitudesService.mine).not.toHaveBeenCalled();
    expect(compiled.textContent).toContain('Consultando la oferta FCT');
  });
});
