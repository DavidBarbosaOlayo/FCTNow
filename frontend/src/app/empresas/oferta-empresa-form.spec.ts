import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';
import { OfertaFct } from '../practicas/ofertas.models';
import { EmpresaOfertasService } from './empresa-ofertas.service';
import { OfertaEmpresaFormPage } from './oferta-empresa-form';

describe('OfertaEmpresaFormPage', () => {
  let fixture: ComponentFixture<OfertaEmpresaFormPage>;
  let service: jasmine.SpyObj<EmpresaOfertasService>;
  let navigateSpy: jasmine.Spy;

  const sampleOferta: OfertaFct = {
    id: 7,
    empresaId: 5,
    empresaNombre: 'Tech Norte',
    titulo: 'Practicas web',
    descripcion: 'Desc',
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
  };

  async function configure({
    routeId,
    detail,
    platformId = 'browser',
  }: {
    routeId?: string;
    detail?: Observable<OfertaFct>;
    platformId?: string;
  } = {}): Promise<void> {
    service = jasmine.createSpyObj<EmpresaOfertasService>('EmpresaOfertasService', [
      'create',
      'update',
      'detail',
    ]);
    service.create.and.returnValue(of(sampleOferta));
    service.update.and.returnValue(of(sampleOferta));
    if (detail) {
      service.detail.and.returnValue(detail);
    }

    const activatedRoute = {
      snapshot: {
        paramMap: convertToParamMap(routeId ? { id: routeId } : {}),
      },
    };

    await TestBed.configureTestingModule({
      imports: [OfertaEmpresaFormPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: EmpresaOfertasService, useValue: service },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: PLATFORM_ID, useValue: platformId },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    navigateSpy = spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));

    fixture = TestBed.createComponent(OfertaEmpresaFormPage);
  }

  it('should render the create form when no id is provided', async () => {
    await configure();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.route-hero')).toBeNull();
    expect(compiled.textContent).toContain('Crear oferta');
  });

  it('should render the edit form and prefill it when editing', async () => {
    await configure({ routeId: '7', detail: of(sampleOferta) });
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.route-hero')).toBeNull();
    expect(compiled.textContent).toContain('Guardar cambios');
    const titleInput = compiled.querySelector<HTMLInputElement>('input[formControlName="titulo"]');
    expect(titleInput?.value).toBe('Practicas web');
  });

  it('should reject submission when fechaFin is earlier than fechaInicio', async () => {
    await configure();
    fixture.detectChanges();

    const componentInstance = fixture.componentInstance;
    componentInstance['form'].setValue({
      titulo: 'Practicas',
      descripcion: 'Desc',
      familiaProfesional: 'Informatica',
      cicloFormativo: '',
      localidad: 'Valencia',
      provincia: 'Valencia',
      modalidad: 'PRESENCIAL',
      plazas: 2,
      fechaInicio: '2026-12-15',
      fechaFin: '2026-09-15',
      tareas: 'Tareas',
      requisitos: '',
    });

    componentInstance['submit']();
    fixture.detectChanges();

    expect(service.create).not.toHaveBeenCalled();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('La fecha de inicio debe ser anterior');
  });

  it('should call create and navigate on success', async () => {
    await configure();
    fixture.detectChanges();

    const componentInstance = fixture.componentInstance;
    componentInstance['form'].setValue({
      titulo: 'Practicas',
      descripcion: 'Descripcion completa.',
      familiaProfesional: 'Informatica',
      cicloFormativo: '',
      localidad: 'Valencia',
      provincia: 'Valencia',
      modalidad: 'PRESENCIAL',
      plazas: 2,
      fechaInicio: '2026-09-15',
      fechaFin: '2026-12-15',
      tareas: 'Tareas variadas.',
      requisitos: '',
    });

    componentInstance['submit']();

    expect(service.create).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith('/empresa/ofertas');
  });

  it('should avoid calling the backend during server rendering', async () => {
    await configure({ platformId: 'server' });
    fixture.detectChanges();

    expect(service.detail).not.toHaveBeenCalled();
    expect(service.create).not.toHaveBeenCalled();
  });
});
