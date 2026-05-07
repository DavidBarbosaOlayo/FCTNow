import { HttpErrorResponse } from '@angular/common/http';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { OfertaFct } from '../practicas/ofertas.models';
import { EmpresaOfertasService } from './empresa-ofertas.service';
import { MisOfertasEmpresaPage } from './mis-ofertas-empresa';

describe('MisOfertasEmpresaPage', () => {
  let fixture: ComponentFixture<MisOfertasEmpresaPage>;
  let service: jasmine.SpyObj<EmpresaOfertasService>;

  const sampleOfertas: OfertaFct[] = [
    {
      id: 1,
      empresaId: 5,
      empresaNombre: 'Tech Norte',
      titulo: 'Practicas web',
      descripcion: 'Desc 1',
      familiaProfesional: 'Informatica',
      cicloFormativo: 'DAW',
      localidad: 'Valencia',
      provincia: 'Valencia',
      modalidad: 'PRESENCIAL',
      fechaInicio: '2026-09-15',
      fechaFin: '2026-12-15',
      plazas: 2,
      requisitos: null,
      tareas: 'Maquetacion',
      estado: 'BORRADOR',
      createdAt: '2026-05-06T10:00:00Z',
      updatedAt: '2026-05-06T10:00:00Z',
    },
    {
      id: 2,
      empresaId: 5,
      empresaNombre: 'Tech Norte',
      titulo: 'Soporte sistemas',
      descripcion: 'Desc 2',
      familiaProfesional: 'Informatica',
      cicloFormativo: 'SMR',
      localidad: 'Valencia',
      provincia: 'Valencia',
      modalidad: 'HIBRIDA',
      fechaInicio: '2026-10-01',
      fechaFin: '2027-01-20',
      plazas: 1,
      requisitos: null,
      tareas: 'Soporte',
      estado: 'PUBLICADA',
      createdAt: '2026-05-06T10:00:00Z',
      updatedAt: '2026-05-06T10:00:00Z',
    },
  ];

  async function configure({
    result = of(sampleOfertas) as Observable<OfertaFct[]>,
    platformId = 'browser',
  }: {
    result?: Observable<OfertaFct[]>;
    platformId?: string;
  } = {}): Promise<void> {
    service = jasmine.createSpyObj<EmpresaOfertasService>('EmpresaOfertasService', [
      'listMine',
      'changeEstado',
      'delete',
    ]);
    service.listMine.and.returnValue(result);

    await TestBed.configureTestingModule({
      imports: [MisOfertasEmpresaPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: EmpresaOfertasService, useValue: service },
        { provide: PLATFORM_ID, useValue: platformId },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MisOfertasEmpresaPage);
  }

  it('should render the company offers list with the right counter', async () => {
    await configure();
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(service.listMine).toHaveBeenCalled();
    expect(compiled.textContent).toContain('Practicas web');
    expect(compiled.textContent).toContain('Soporte sistemas');
    expect(compiled.textContent).toContain('2 ofertas registradas');
  });

  it('should expose Borrador actions for draft offers and Cerrar action for published offers', async () => {
    await configure();
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(compiled.querySelectorAll('button'))
      .map((btn) => btn.textContent?.trim());
    expect(buttons).toContain('Publicar');
    expect(buttons).toContain('Eliminar');
    expect(buttons).toContain('Cerrar');
  });

  it('should render the empty state when there are no offers', async () => {
    await configure({ result: of([]) });
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Aun no has registrado ninguna oferta');
  });

  it('should render the not authenticated state on 401', async () => {
    await configure({
      result: throwError(() => new HttpErrorResponse({ status: 401 })),
    });
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Inicia sesion para gestionar tus ofertas');
  });

  it('should render the error state on 0 (network failure)', async () => {
    await configure({
      result: throwError(() => new HttpErrorResponse({ status: 0 })),
    });
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No se pudieron cargar tus ofertas');
  });

  it('should avoid calling the backend during server rendering', async () => {
    await configure({ platformId: 'server' });
    fixture.detectChanges();

    expect(service.listMine).not.toHaveBeenCalled();
  });
});
