import { HttpErrorResponse } from '@angular/common/http';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { SolicitudExterna } from '../practicas/solicitudes-externas.models';
import { SolicitudesExternasService } from '../practicas/solicitudes-externas.service';
import { SolicitudFct } from '../practicas/solicitudes.models';
import { SolicitudesService } from '../practicas/solicitudes.service';
import { MisSolicitudesPage } from './mis-solicitudes';

describe('MisSolicitudesPage', () => {
  let fixture: ComponentFixture<MisSolicitudesPage>;
  let authService: jasmine.SpyObj<AuthService>;
  let solicitudesService: jasmine.SpyObj<SolicitudesService>;
  let solicitudesExternasService: jasmine.SpyObj<SolicitudesExternasService>;

  const sampleSolicitudes: SolicitudFct[] = [
    {
      id: 1,
      ofertaId: 34,
      ofertaTitulo: 'Practicas de desarrollo web',
      empresaNombre: 'Tech Norte Formacion',
      estado: 'SOLICITADA',
      createdAt: '2026-05-06T10:00:00Z',
      asignadaPorCentro: false,
      fechaAsignacion: null,
    },
  ];

  async function configure({
    accessToken = 'jwt-token',
    result = of(sampleSolicitudes) as Observable<SolicitudFct[]>,
    externasResult = of([]) as Observable<SolicitudExterna[]>,
    platformId = 'browser',
  }: {
    accessToken?: string | null;
    result?: Observable<SolicitudFct[]>;
    externasResult?: Observable<SolicitudExterna[]>;
    platformId?: string;
  } = {}): Promise<void> {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['accessToken']);
    authService.accessToken.and.returnValue(accessToken);

    solicitudesService = jasmine.createSpyObj<SolicitudesService>('SolicitudesService', ['mine']);
    solicitudesService.mine.and.returnValue(result);
    solicitudesExternasService = jasmine.createSpyObj<SolicitudesExternasService>(
      'SolicitudesExternasService',
      ['mine', 'changeEstado'],
    );
    solicitudesExternasService.mine.and.returnValue(externasResult);
    solicitudesExternasService.changeEstado.and.callFake((id, estado) =>
      of({
        ...sampleSolicitudExterna,
        id,
        estado,
        updatedAt: '2026-05-09T11:00:00Z',
      }),
    );

    await TestBed.configureTestingModule({
      imports: [MisSolicitudesPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: SolicitudesService, useValue: solicitudesService },
        { provide: SolicitudesExternasService, useValue: solicitudesExternasService },
        { provide: PLATFORM_ID, useValue: platformId },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MisSolicitudesPage);
  }

  const sampleSolicitudExterna: SolicitudExterna = {
    id: 20,
    alumnoId: 7,
    alumnoNombre: 'Alumno Demo',
    fuente: 'ADZUNA',
    idExterno: 'adz-20',
    titulo: 'Becario QA',
    empresaNombre: 'Logistica Levante',
    localidad: 'Castellon',
    region: 'Comunidad Valenciana',
    urlAplicacion: 'https://www.adzuna.es/land/ad/20',
    publicadoEn: null,
    categoria: 'TI',
    estado: 'SOLICITADA',
    createdAt: '2026-05-08T09:00:00Z',
    updatedAt: '2026-05-08T09:00:00Z',
    actualizadoPorId: 7,
  };

  it('should render the list of authenticated student applications', async () => {
    await configure();

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(solicitudesService.mine).toHaveBeenCalled();
    expect(compiled.querySelector('.route-hero')).toBeNull();
    expect(compiled.textContent).toContain('Practicas de desarrollo web');
    expect(compiled.textContent).toContain('Tech Norte Formacion');
    expect(compiled.textContent).toContain('Solicitada');
    expect(compiled.textContent).toContain('1 solicitud enviada');

    const detailLink = compiled.querySelector<HTMLAnchorElement>('.solicitud-link');
    expect(detailLink?.getAttribute('href')).toBe('/practicas/34');
  });

  it('should render the empty state when the alumno has no applications', async () => {
    await configure({ result: of([]) });

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Aún no has solicitado ninguna oferta');

    const catalogLink = compiled.querySelector<HTMLAnchorElement>('.back-link');
    expect(catalogLink?.getAttribute('href')).toBe('/practicas');
  });

  it('should render the not authenticated state when there is no session', async () => {
    await configure({ accessToken: null });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(solicitudesService.mine).not.toHaveBeenCalled();
    expect(solicitudesExternasService.mine).not.toHaveBeenCalled();
    expect(compiled.textContent).toContain('Inicia sesión para ver tus solicitudes');

    const loginLink = compiled.querySelector<HTMLAnchorElement>('.back-link');
    expect(loginLink?.getAttribute('href')).toBe('/login');
  });

  it('should render the not authenticated state for a 401 response', async () => {
    await configure({
      result: throwError(() => new HttpErrorResponse({ status: 401 })),
    });

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Inicia sesión para ver tus solicitudes');
  });

  it('should render the error state when the backend is unreachable', async () => {
    await configure({
      result: throwError(() => new HttpErrorResponse({ status: 0 })),
    });

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No se pudieron cargar tus solicitudes');
    expect(compiled.textContent).toContain('backend esté disponible');
  });

  it('should avoid calling the backend during server rendering', async () => {
    await configure({ platformId: 'server' });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(solicitudesService.mine).not.toHaveBeenCalled();
    expect(solicitudesExternasService.mine).not.toHaveBeenCalled();
    expect(compiled.textContent).toContain('Inicia sesión para ver tus solicitudes');
  });

  it('should render the new estados with their labels', async () => {
    await configure({
      result: of([
        { ...sampleSolicitudes[0], id: 2, estado: 'ACEPTADA' },
        { ...sampleSolicitudes[0], id: 3, estado: 'RECHAZADA' },
      ]),
    });

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Aceptada');
    expect(compiled.textContent).toContain('Rechazada');
  });

  it('should render the asignada por el centro badge when the solicitud is assigned', async () => {
    await configure({
      result: of([
        {
          ...sampleSolicitudes[0],
          id: 4,
          estado: 'ACEPTADA',
          asignadaPorCentro: true,
          fechaAsignacion: '2026-05-09T08:00:00Z',
        },
      ]),
    });

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Aceptada');
    expect(compiled.textContent).toContain('Asignada por el centro');
    expect(compiled.textContent).toContain('Asignada el');
  });

  it('should hide the asignacion badge when not assigned yet', async () => {
    await configure();

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Asignada por el centro');
  });

  it('should render and update external solicitudes from Adzuna', async () => {
    await configure({ externasResult: of([sampleSolicitudExterna]) });
    spyOn(window, 'confirm').and.returnValue(true);

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Mis solicitudes externas');
    expect(compiled.textContent).toContain('Becario QA');
    expect(compiled.textContent).toContain('Logistica Levante');
    expect(compiled.querySelector('.origen-badge')?.textContent).toContain('Adzuna');

    const aceptarBtn = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.trim() === 'Marcar como aceptada',
    );
    aceptarBtn!.click();
    fixture.detectChanges();

    expect(window.confirm).toHaveBeenCalled();
    expect(solicitudesExternasService.changeEstado).toHaveBeenCalledWith(20, 'ACEPTADA');
    expect(compiled.textContent).toContain('Aceptada');
  });
});
