import { HttpErrorResponse } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AsignacionesExternasService } from '../asignaciones/asignaciones-externas.service';
import { AsignacionesService } from '../asignaciones/asignaciones.service';
import { AuthService } from '../auth/auth.service';
import { TutorPage } from './tutor';
import { TutorAlumno } from './tutor-alumnos.models';
import { TutorAlumnosService } from './tutor-alumnos.service';

describe('TutorPage', () => {
  let fixture: ComponentFixture<TutorPage>;
  let service: jasmine.SpyObj<TutorAlumnosService>;
  let asignacionesService: jasmine.SpyObj<AsignacionesService>;
  let asignacionesExternasService: jasmine.SpyObj<AsignacionesExternasService>;

  const sampleAlumnos: TutorAlumno[] = [
    {
      id: 1,
      email: 'ana@example.com',
      displayName: 'Ana Garcia',
      enabled: true,
      photoDataUrl: 'data:image/png;base64,aW1n',
      hasCv: true,
      cvFileName: 'ana-cv.pdf',
      cvContentType: 'application/pdf',
      cvSize: 2048,
      cvUpdatedAt: '2026-05-07T12:00:00Z',
      preferencias: {
        familiaProfesional: 'Informatica',
        cicloFormativo: 'DAW',
        localidad: 'Valencia',
        modalidad: 'PRESENCIAL',
        fechaDisponibilidad: '2026-09-01',
        observaciones: 'Preferencia por frontend.',
      },
      solicitudes: { total: 3, solicitadas: 1, aceptadas: 1, rechazadas: 1 },
      asignacionActual: {
        id: 11,
        estado: 'ACTIVA',
        fechaAsignacion: '2026-05-09T10:00:00Z',
        oferta: 'Practicas web',
        empresa: 'Tech Norte',
        observaciones: 'Inicia el lunes',
      },
      asignacionPendiente: null,
    },
    {
      id: 2,
      email: 'luis@example.com',
      displayName: 'Luis Martinez',
      enabled: true,
      photoDataUrl: null,
      hasCv: false,
      cvFileName: null,
      cvContentType: null,
      cvSize: null,
      cvUpdatedAt: null,
      preferencias: null,
      solicitudes: { total: 1, solicitadas: 1, aceptadas: 0, rechazadas: 0 },
      asignacionActual: null,
      asignacionPendiente: null,
    },
    {
      id: 3,
      email: 'marta@example.com',
      displayName: 'Marta Lopez',
      enabled: true,
      photoDataUrl: null,
      hasCv: false,
      cvFileName: null,
      cvContentType: null,
      cvSize: null,
      cvUpdatedAt: null,
      preferencias: {
        familiaProfesional: 'Sanidad',
        cicloFormativo: 'CFGS Imagen para el Diagnostico',
        localidad: 'Alicante',
        modalidad: 'PRESENCIAL',
        fechaDisponibilidad: null,
        observaciones: null,
      },
      solicitudes: { total: 2, solicitadas: 0, aceptadas: 1, rechazadas: 1 },
      asignacionActual: null,
      asignacionPendiente: {
        tipo: 'INTERNA',
        solicitudId: 77,
        aceptadaEn: '2026-05-10T09:00:00Z',
        oferta: 'Practicas clinica',
        empresa: 'Clinica Mediterraneo',
        localidad: 'Alicante',
        urlAplicacion: null,
      },
    },
  ];

  async function configure(
    listResult: Observable<TutorAlumno[]> = of(sampleAlumnos),
  ): Promise<ComponentFixture<TutorPage>> {
    service = jasmine.createSpyObj<TutorAlumnosService>('TutorAlumnosService', ['list', 'downloadCv']);
    service.list.and.returnValue(listResult);
    service.downloadCv.and.returnValue(of(new Blob(['pdf'], { type: 'application/pdf' })));
    asignacionesService = jasmine.createSpyObj<AsignacionesService>('AsignacionesService', ['create']);
    asignacionesService.create.and.returnValue(
      of({
        id: 88,
        estado: 'ACTIVA',
        fechaAsignacion: '2026-05-11T10:00:00Z',
        observaciones: null,
        solicitudId: 77,
        alumno: { id: 3, displayName: 'Marta Lopez', email: 'marta@example.com' },
        oferta: { id: 4, titulo: 'Practicas clinica' },
        empresa: { id: 5, nombre: 'Clinica Mediterraneo' },
      }),
    );
    asignacionesExternasService = jasmine.createSpyObj<AsignacionesExternasService>(
      'AsignacionesExternasService',
      ['create'],
    );
    asignacionesExternasService.create.and.returnValue(
      of({
        id: 99,
        solicitudExternaId: 78,
        alumnoId: 3,
        alumnoNombre: 'Marta Lopez',
        fuente: 'ADZUNA',
        idExterno: 'ext-1',
        titulo: 'Practicas clinica',
        empresaNombre: 'Clinica Mediterraneo',
        localidad: 'Alicante',
        region: null,
        urlAplicacion: 'https://example.com',
        estado: 'ACTIVA',
        observaciones: null,
        fechaAsignacion: '2026-05-11T10:00:00Z',
      }),
    );

    const authStub = {
      currentUser: () => ({
        id: 99,
        email: 'tutor@example.com',
        displayName: 'Tutor Demo',
        roles: ['TUTOR_CENTRO'],
      }),
    };

    await TestBed.configureTestingModule({
      imports: [TutorPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TutorAlumnosService, useValue: service },
        { provide: AsignacionesService, useValue: asignacionesService },
        { provide: AsignacionesExternasService, useValue: asignacionesExternasService },
        { provide: AuthService, useValue: authStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TutorPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders the alumno list with full details', async () => {
    await configure();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect((fixture.nativeElement as HTMLElement).querySelector('.route-hero')).toBeNull();
    expect(text).toContain('Alumnos');
    expect(text).toContain('Ana Garcia');
    expect(text).toContain('ana@example.com');
    expect(text).toContain('DAW');
    expect(text).toContain('Tech Norte');
    expect(text).toContain('Luis Martinez');
    expect(text).toContain('Marta Lopez');
    expect((fixture.nativeElement as HTMLElement).querySelector('.alumno-list')).not.toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('.alumno-grid')).toBeNull();
  });

  it('counts assignment KPIs correctly', async () => {
    await configure();

    const kpis = (fixture.nativeElement as HTMLElement).querySelectorAll('.kpi-value');
    expect(kpis.length).toBe(4);
    expect(kpis[0].textContent?.trim()).toBe('3'); // total alumnos
    // Asignados: 1 (Ana) de 3
    expect(kpis[1].textContent?.replace(/\s+/g, '')).toBe('1/3');
    // Aceptados: 2 (Ana y Marta tienen >=1 aceptada) de 3
    expect(kpis[2].textContent?.replace(/\s+/g, '')).toBe('2/3');
    // Solicitudes pendientes: Ana(1) + Luis(1) + Marta(0) = 2
    expect(kpis[3].textContent?.trim()).toBe('2');
  });

  it('filters by estado FCT', async () => {
    await configure();
    const compiled = fixture.nativeElement as HTMLElement;

    let rows = compiled.querySelectorAll('.alumno-row');
    expect(rows.length).toBe(3);

    const select = compiled.querySelectorAll<HTMLSelectElement>('.filter-control select')[0];
    select.value = 'ASIGNADO';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    rows = compiled.querySelectorAll('.alumno-row');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Ana Garcia');
  });

  it('filters by search term', async () => {
    await configure();
    const compiled = fixture.nativeElement as HTMLElement;

    const searchInput = compiled.querySelector<HTMLInputElement>('input[type="search"]')!;
    searchInput.value = 'sanidad';
    searchInput.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    const rows = compiled.querySelectorAll('.alumno-row');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Marta Lopez');
  });

  it('clears active filters from the toolbar button', async () => {
    await configure();
    const compiled = fixture.nativeElement as HTMLElement;

    const searchInput = compiled.querySelector<HTMLInputElement>('input[type="search"]')!;
    searchInput.value = 'sanidad';
    searchInput.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    const clearButton = compiled.querySelector<HTMLButtonElement>('.clear-filters-button')!;
    expect(clearButton.disabled).toBeFalse();
    expect(compiled.querySelectorAll('.alumno-row').length).toBe(1);

    clearButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(searchInput.value).toBe('');
    expect(clearButton.disabled).toBeTrue();
    expect(compiled.querySelectorAll('.alumno-row').length).toBe(3);
  });

  it('filters by familia profesional and ciclo formativo', async () => {
    await configure();
    const compiled = fixture.nativeElement as HTMLElement;

    const selects = compiled.querySelectorAll<HTMLSelectElement>('.filter-control select');
    selects[1].value = 'Sanidad';
    selects[1].dispatchEvent(new Event('change'));
    selects[2].value = 'CFGS Imagen para el Diagnostico';
    selects[2].dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    const rows = compiled.querySelectorAll('.alumno-row');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Marta Lopez');
  });

  it('deduplicates family options when several cycles share the same family', async () => {
    await configure(
      of([
        {
          ...sampleAlumnos[0],
          preferencias: {
            ...sampleAlumnos[0].preferencias!,
            familiaProfesional: 'Administración y gestión',
            cicloFormativo: 'Administración y Finanzas',
          },
        },
        {
          ...sampleAlumnos[1],
          preferencias: {
            familiaProfesional: ' Administración y gestión ',
            cicloFormativo: 'Asistencia a la Dirección',
            localidad: 'Valencia',
            modalidad: 'PRESENCIAL',
            fechaDisponibilidad: null,
            observaciones: null,
          },
        },
      ]),
    );
    const compiled = fixture.nativeElement as HTMLElement;

    const familySelect = compiled.querySelectorAll<HTMLSelectElement>('.filter-control select')[1];
    const familyOptions = Array.from(familySelect.options).map((option) => option.textContent?.trim());

    expect(familyOptions.filter((option) => option === 'Administración y gestión').length).toBe(1);

    familySelect.value = 'Administración y gestión';
    familySelect.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.alumno-row').length).toBe(2);
  });

  it('orders alumnos without assignment before assigned alumnos', async () => {
    await configure();
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = Array.from(compiled.querySelectorAll('.alumno-row'));

    expect(cards[0].textContent).toContain('Luis Martinez');
    expect(cards[1].textContent).toContain('Marta Lopez');
    expect(cards[2].textContent).toContain('Ana Garcia');
  });

  it('opens a confirmation modal and creates an internal assignment from the card', async () => {
    await configure();
    const compiled = fixture.nativeElement as HTMLElement;

    const assignButton = Array.from(compiled.querySelectorAll<HTMLButtonElement>('.assign-button'))
      .find((button) => button.textContent?.includes('Asignar'))!;
    assignButton.click();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('Confirmar asignación');
    expect(compiled.textContent).toContain('Clinica Mediterraneo');

    const confirmButton = Array.from(compiled.querySelectorAll<HTMLButtonElement>('.primary-button'))
      .find((button) => button.textContent?.includes('Confirmar asignación'))!;
    confirmButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(asignacionesService.create).toHaveBeenCalledOnceWith({ solicitudId: 77 });
  });

  it('switches from the default list view to cards view', async () => {
    await configure();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.alumno-list')).not.toBeNull();
    expect(compiled.querySelector('.alumno-grid')).toBeNull();

    const cardsButton = Array.from(compiled.querySelectorAll<HTMLButtonElement>('.view-toggle button'))
      .find((button) => button.textContent?.includes('Cards'))!;
    cardsButton.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.alumno-list')).toBeNull();
    expect(compiled.querySelectorAll('.alumno-card').length).toBe(3);
  });

  it('shows error state when service fails', async () => {
    await configure(throwError(() => new HttpErrorResponse({ status: 500 })));

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('No se pudo cargar el listado');
    expect(text).toContain('Error 500');
  });

  it('renders Sin asignación pill when there is no current assignment', async () => {
    await configure();
    const compiled = fixture.nativeElement as HTMLElement;
    const pills = Array.from(compiled.querySelectorAll('.estado-pill'));
    expect(pills.some((p) => (p.textContent ?? '').includes('Sin asignación'))).toBeTrue();
  });
});
