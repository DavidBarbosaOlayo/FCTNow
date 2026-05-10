import { HttpErrorResponse } from '@angular/common/http';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import {
  AsignacionExternaCandidata,
  AsignacionFctExterna,
} from './asignaciones-externas.models';
import { AsignacionesExternasService } from './asignaciones-externas.service';
import { AsignacionCandidata, AsignacionFct } from './asignaciones.models';
import { AsignacionesPage } from './asignaciones';
import { AsignacionesService } from './asignaciones.service';

describe('AsignacionesPage', () => {
  let fixture: ComponentFixture<AsignacionesPage>;
  let service: jasmine.SpyObj<AsignacionesService>;
  let externalService: jasmine.SpyObj<AsignacionesExternasService>;

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

  const sampleExternal: AsignacionFctExterna[] = [
    {
      id: 31,
      solicitudExternaId: 20,
      alumnoId: 7,
      alumnoNombre: 'Alumno Externo',
      fuente: 'ADZUNA',
      idExterno: 'adz-20',
      titulo: 'Becario QA',
      empresaNombre: 'Logistica Levante',
      localidad: 'Castellon',
      region: 'Comunidad Valenciana',
      urlAplicacion: 'https://www.adzuna.es/land/ad/20',
      estado: 'ACTIVA',
      observaciones: 'Confirmada',
      fechaAsignacion: '2026-05-09T10:00:00Z',
    },
  ];

  const sampleExternalCandidatas: AsignacionExternaCandidata[] = [
    {
      solicitudExternaId: 21,
      alumnoId: 8,
      alumnoNombre: 'Alumno Externo Pendiente',
      fuente: 'ADZUNA',
      idExterno: 'adz-21',
      titulo: 'Becario Frontend',
      empresaNombre: 'Tech Sur',
      localidad: 'Valencia',
      region: 'Comunidad Valenciana',
      urlAplicacion: 'https://www.adzuna.es/land/ad/21',
      aceptadaEn: '2026-05-09T09:00:00Z',
    },
  ];

  async function configure({
    listResult = of(sampleAsignaciones) as Observable<AsignacionFct[]>,
    candidatasResult = of(sampleCandidatas) as Observable<AsignacionCandidata[]>,
    externalListResult = of([]) as Observable<AsignacionFctExterna[]>,
    externalCandidatasResult = of([]) as Observable<AsignacionExternaCandidata[]>,
    platformId = 'browser',
  }: {
    listResult?: Observable<AsignacionFct[]>;
    candidatasResult?: Observable<AsignacionCandidata[]>;
    externalListResult?: Observable<AsignacionFctExterna[]>;
    externalCandidatasResult?: Observable<AsignacionExternaCandidata[]>;
    platformId?: string;
  } = {}): Promise<void> {
    service = jasmine.createSpyObj<AsignacionesService>('AsignacionesService', [
      'list',
      'listCandidatas',
      'create',
    ]);
    service.list.and.returnValue(listResult);
    service.listCandidatas.and.returnValue(candidatasResult);
    service.create.and.returnValue(of(sampleAsignaciones[0]));
    externalService = jasmine.createSpyObj<AsignacionesExternasService>(
      'AsignacionesExternasService',
      ['list', 'listCandidatas', 'create'],
    );
    externalService.list.and.returnValue(externalListResult);
    externalService.listCandidatas.and.returnValue(externalCandidatasResult);
    externalService.create.and.returnValue(of(sampleExternal[0]));

    await TestBed.configureTestingModule({
      imports: [AsignacionesPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AsignacionesService, useValue: service },
        { provide: AsignacionesExternasService, useValue: externalService },
        { provide: PLATFORM_ID, useValue: platformId },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AsignacionesPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('should render the merged asignaciones list with KPIs', async () => {
    await configure({ externalListResult: of(sampleExternal) });

    const compiled = fixture.nativeElement as HTMLElement;
    expect(service.list).toHaveBeenCalled();
    expect(externalService.list).toHaveBeenCalled();
    expect(compiled.textContent).toContain('Alumno Demo');
    expect(compiled.textContent).toContain('Practicas web');
    expect(compiled.textContent).toContain('Tech Norte');
    expect(compiled.textContent).toContain('Becario QA');
    expect(compiled.textContent).toContain('Logistica Levante');
    expect(compiled.querySelector('.external-marker')).toBeNull();

    const kpis = compiled.querySelectorAll('.kpi-value');
    expect(kpis.length).toBe(4);
    expect(kpis[0].textContent?.trim()).toBe('2');
    expect(kpis[3].textContent?.trim()).toBe('2');
  });

  it('should render the empty state when there are no asignaciones', async () => {
    await configure({ listResult: of([]) });

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Aun no hay asignaciones registradas');
  });

  it('should render the not authenticated state on 401', async () => {
    await configure({ listResult: throwError(() => new HttpErrorResponse({ status: 401 })) });

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Inicia sesion para gestionar las asignaciones');
  });

  it('should render the error state on 403', async () => {
    await configure({ listResult: throwError(() => new HttpErrorResponse({ status: 403 })) });

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No se pudieron cargar las asignaciones');
  });

  it('should populate the merged candidate select with internal and external options', async () => {
    await configure({
      listResult: of([]),
      externalCandidatasResult: of(sampleExternalCandidatas),
    });

    const compiled = fixture.nativeElement as HTMLElement;
    const select = compiled.querySelector<HTMLSelectElement>('#candidataKey');
    expect(select).toBeTruthy();
    const optionLabels = Array.from(select!.options).map((o) => o.textContent?.trim() ?? '');
    expect(optionLabels.some((label) => label.includes('Alumno Demo'))).toBeTrue();
    expect(optionLabels.some((label) => label.includes('Alumno Externo Pendiente'))).toBeTrue();
  });

  it('should call internal create when picking an internal candidate', async () => {
    await configure({ listResult: of([]) });

    const compiled = fixture.nativeElement as HTMLElement;
    const select = compiled.querySelector<HTMLSelectElement>('#candidataKey')!;
    select.value = select.options[1].value;
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    const submit = compiled.querySelector<HTMLButtonElement>('button.primary-action')!;
    submit.click();
    await fixture.whenStable();

    expect(service.create).toHaveBeenCalledWith(jasmine.objectContaining({ solicitudId: 5 }));
    expect(externalService.create).not.toHaveBeenCalled();
  });

  it('should call external create when picking an external candidate', async () => {
    await configure({
      listResult: of([]),
      candidatasResult: of([]),
      externalCandidatasResult: of(sampleExternalCandidatas),
    });

    const compiled = fixture.nativeElement as HTMLElement;
    const select = compiled.querySelector<HTMLSelectElement>('#candidataKey')!;
    select.value = select.options[1].value;
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    const submit = compiled.querySelector<HTMLButtonElement>('button.primary-action')!;
    submit.click();
    await fixture.whenStable();

    expect(externalService.create).toHaveBeenCalledWith(
      jasmine.objectContaining({ solicitudExternaId: 21 }),
    );
    expect(service.create).not.toHaveBeenCalled();
  });

  it('should filter assignments by estado', async () => {
    const finalizada: AsignacionFct = {
      ...sampleAsignaciones[0],
      id: 12,
      estado: 'FINALIZADA',
      fechaAsignacion: '2026-04-01T10:00:00Z',
    };
    await configure({ listResult: of([sampleAsignaciones[0], finalizada]) });

    const compiled = fixture.nativeElement as HTMLElement;
    let cards = compiled.querySelectorAll('.asignaciones-grid .asignacion-card');
    expect(cards.length).toBe(2);

    const filterSelect = compiled.querySelector<HTMLSelectElement>('.filter-control select')!;
    filterSelect.value = 'FINALIZADA';
    filterSelect.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    cards = compiled.querySelectorAll('.asignaciones-grid .asignacion-card');
    expect(cards.length).toBe(1);
  });
});
