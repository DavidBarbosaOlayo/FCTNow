import { HttpErrorResponse } from '@angular/common/http';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AsignacionCandidata, AsignacionFct } from './asignaciones.models';
import { AsignacionesPage } from './asignaciones';
import { AsignacionesService } from './asignaciones.service';

describe('AsignacionesPage', () => {
  let fixture: ComponentFixture<AsignacionesPage>;
  let service: jasmine.SpyObj<AsignacionesService>;

  const sampleAsignaciones: AsignacionFct[] = [
    {
      id: 11,
      estado: 'ACTIVA',
      fechaAsignacion: '2026-05-08T10:00:00Z',
      observaciones: 'Inicia el lunes',
      solicitudId: 5,
      alumno: { id: 7, displayName: 'Alumno Demo', email: 'alumno@example.com' },
      oferta: { id: 9, titulo: 'Practicas web' },
      empresa: { id: 3, nombre: 'Tech Norte' },
    },
  ];

  const sampleCandidatas: AsignacionCandidata[] = [
    {
      solicitudId: 5,
      solicitadaEn: '2026-05-08T09:00:00Z',
      alumno: { id: 7, displayName: 'Alumno Demo', email: 'alumno@example.com' },
      oferta: { id: 9, titulo: 'Practicas web' },
      empresa: { id: 3, nombre: 'Tech Norte' },
    },
  ];

  async function configure({
    listResult = of(sampleAsignaciones) as Observable<AsignacionFct[]>,
    candidatasResult = of(sampleCandidatas) as Observable<AsignacionCandidata[]>,
    platformId = 'browser',
  }: {
    listResult?: Observable<AsignacionFct[]>;
    candidatasResult?: Observable<AsignacionCandidata[]>;
    platformId?: string;
  } = {}): Promise<void> {
    service = jasmine.createSpyObj<AsignacionesService>('AsignacionesService', [
      'list',
      'listCandidatas',
      'create',
    ]);
    service.list.and.returnValue(listResult);
    service.listCandidatas.and.returnValue(candidatasResult);

    await TestBed.configureTestingModule({
      imports: [AsignacionesPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AsignacionesService, useValue: service },
        { provide: PLATFORM_ID, useValue: platformId },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AsignacionesPage);
  }

  it('should render the asignaciones list', async () => {
    await configure();
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(service.list).toHaveBeenCalled();
    expect(compiled.textContent).toContain('Alumno Demo');
    expect(compiled.textContent).toContain('Practicas web');
    expect(compiled.textContent).toContain('Tech Norte');
    expect(compiled.textContent).toContain('1 asignacion registrada');
  });

  it('should render the empty state when there are no asignaciones', async () => {
    await configure({ listResult: of([]) });
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Aun no hay asignaciones registradas');
  });

  it('should render the not authenticated state on 401', async () => {
    await configure({ listResult: throwError(() => new HttpErrorResponse({ status: 401 })) });
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Inicia sesion para gestionar las asignaciones');
  });

  it('should render the error state on 403', async () => {
    await configure({ listResult: throwError(() => new HttpErrorResponse({ status: 403 })) });
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No se pudieron cargar las asignaciones');
  });

  it('should populate the candidate select with accepted solicitudes', async () => {
    await configure({ listResult: of([]) });
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const select = compiled.querySelector<HTMLSelectElement>('#solicitudId')!;
    expect(select).toBeTruthy();
    const optionLabels = Array.from(select.options).map((opt) => opt.textContent?.trim() ?? '');
    expect(optionLabels[0]).toBe('Selecciona una solicitud');
    expect(optionLabels.some((label) => label.includes('Alumno Demo'))).toBeTrue();
    expect(optionLabels.some((label) => label.includes('Practicas web'))).toBeTrue();
  });

  it('should hide the form and show a message when there are no candidates', async () => {
    await configure({ listResult: of([]), candidatasResult: of([]) });
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#solicitudId')).toBeNull();
    expect(compiled.textContent).toContain('No hay solicitudes aceptadas pendientes de asignar');
  });

  it('should create an asignacion when a candidate is selected and the form is submitted', async () => {
    await configure({ listResult: of([]) });
    const created: AsignacionFct = { ...sampleAsignaciones[0], id: 99 };
    service.create.and.returnValue(of(created));

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const select = compiled.querySelector<HTMLSelectElement>('#solicitudId')!;
    select.value = select.options[1].value;
    select.dispatchEvent(new Event('change'));

    const observacionesInput = compiled.querySelector<HTMLTextAreaElement>('#observaciones')!;
    observacionesInput.value = '  Inicia el lunes  ';
    observacionesInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    const form = compiled.querySelector('form')!;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(service.create).toHaveBeenCalledWith({
      solicitudId: 5,
      observaciones: 'Inicia el lunes',
    });
    expect(compiled.textContent).toContain('Asignacion creada correctamente');
    expect(compiled.textContent).toContain('1 asignacion registrada');
    expect(compiled.querySelector('#solicitudId')).toBeNull();
    expect(compiled.textContent).toContain('No hay solicitudes aceptadas pendientes de asignar');
  });

  it('should report a 409 error when create fails on a stale candidate', async () => {
    await configure({ listResult: of([]) });
    service.create.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const select = compiled.querySelector<HTMLSelectElement>('#solicitudId')!;
    select.value = select.options[1].value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const form = compiled.querySelector('form')!;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(compiled.textContent).toContain('la solicitud no esta aceptada o ya tiene una asignacion');
  });

  it('should avoid calling the backend during server rendering', async () => {
    await configure({ platformId: 'server' });
    fixture.detectChanges();

    expect(service.list).not.toHaveBeenCalled();
    expect(service.listCandidatas).not.toHaveBeenCalled();
  });
});
