import { HttpErrorResponse } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { TutorPage } from './tutor';
import { TutorAlumno } from './tutor-alumnos.models';
import { TutorAlumnosService } from './tutor-alumnos.service';

describe('TutorPage', () => {
  let fixture: ComponentFixture<TutorPage>;
  let service: jasmine.SpyObj<TutorAlumnosService>;

  const sampleAlumnos: TutorAlumno[] = [
    {
      id: 1,
      email: 'ana@example.com',
      displayName: 'Ana Garcia',
      enabled: true,
      preferencias: {
        familiaProfesional: 'Informatica',
        cicloFormativo: 'DAW',
        localidad: 'Valencia',
        modalidad: 'PRESENCIAL',
        fechaDisponibilidad: '2026-09-01',
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
    },
    {
      id: 2,
      email: 'luis@example.com',
      displayName: 'Luis Martinez',
      enabled: true,
      preferencias: null,
      solicitudes: { total: 1, solicitadas: 1, aceptadas: 0, rechazadas: 0 },
      asignacionActual: null,
    },
    {
      id: 3,
      email: 'marta@example.com',
      displayName: 'Marta Lopez',
      enabled: true,
      preferencias: {
        familiaProfesional: 'Sanidad',
        cicloFormativo: 'CFGS Imagen para el Diagnostico',
        localidad: 'Alicante',
        modalidad: 'PRESENCIAL',
        fechaDisponibilidad: null,
      },
      solicitudes: { total: 2, solicitadas: 0, aceptadas: 1, rechazadas: 1 },
      asignacionActual: null,
    },
  ];

  async function configure(
    listResult: Observable<TutorAlumno[]> = of(sampleAlumnos),
  ): Promise<ComponentFixture<TutorPage>> {
    service = jasmine.createSpyObj<TutorAlumnosService>('TutorAlumnosService', ['list']);
    service.list.and.returnValue(listResult);

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
    expect(text).toContain('Alumnado del centro');
    expect(text).toContain('Ana Garcia');
    expect(text).toContain('ana@example.com');
    expect(text).toContain('DAW');
    expect(text).toContain('Tech Norte');
    expect(text).toContain('Luis Martinez');
    expect(text).toContain('Marta Lopez');
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

    let cards = compiled.querySelectorAll('.alumno-card');
    expect(cards.length).toBe(3);

    const select = compiled.querySelectorAll<HTMLSelectElement>('.filter-control select')[0];
    select.value = 'ASIGNADO';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    cards = compiled.querySelectorAll('.alumno-card');
    expect(cards.length).toBe(1);
    expect(cards[0].textContent).toContain('Ana Garcia');
  });

  it('filters by search term', async () => {
    await configure();
    const compiled = fixture.nativeElement as HTMLElement;

    const searchInput = compiled.querySelector<HTMLInputElement>('input[type="search"]')!;
    searchInput.value = 'sanidad';
    searchInput.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    const cards = compiled.querySelectorAll('.alumno-card');
    expect(cards.length).toBe(1);
    expect(cards[0].textContent).toContain('Marta Lopez');
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
