import { HttpErrorResponse } from '@angular/common/http';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { OfertaFct } from './ofertas.models';
import { OfertasService } from './ofertas.service';
import { OfertaDetailPage } from './oferta-detail';

describe('OfertaDetailPage', () => {
  let fixture: ComponentFixture<OfertaDetailPage>;
  let ofertasService: jasmine.SpyObj<OfertasService>;

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
  }: {
    id?: string;
    result?: Observable<OfertaFct>;
    platformId?: string;
  } = {}): Promise<void> {
    ofertasService = jasmine.createSpyObj<OfertasService>('OfertasService', ['detail']);
    ofertasService.detail.and.returnValue(result);

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

    const backLink = compiled.querySelector<HTMLAnchorElement>('.back-link');
    expect(backLink?.getAttribute('href')).toBe('/practicas');
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
    expect(compiled.textContent).toContain('Consultando la oferta FCT');
  });
});
