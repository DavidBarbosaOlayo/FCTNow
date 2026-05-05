import { HttpErrorResponse } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { OfertaFct } from './ofertas.models';
import { OfertasService } from './ofertas.service';
import { PracticasPage } from './practicas';

describe('PracticasPage', () => {
  let fixture: ComponentFixture<PracticasPage>;
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
    requisitos: null,
    tareas: 'Maquetacion, pruebas funcionales y documentacion tecnica.',
    estado: 'PUBLICADA',
    createdAt: '2026-05-04T12:00:00Z',
    updatedAt: '2026-05-04T12:00:00Z',
  };

  async function configure(result = of([offer])): Promise<void> {
    ofertasService = jasmine.createSpyObj<OfertasService>('OfertasService', ['list']);
    ofertasService.list.and.returnValue(result);

    await TestBed.configureTestingModule({
      imports: [PracticasPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: OfertasService, useValue: ofertasService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PracticasPage);
  }

  it('should render published offers returned by the service', async () => {
    await configure();

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Búsqueda de prácticas');
    expect(compiled.textContent).toContain('Tech Norte Formacion');
    expect(compiled.textContent).toContain('Practicas de desarrollo web');
    expect(compiled.textContent).toContain('1 oferta disponible');

    const detailLink = compiled.querySelector<HTMLAnchorElement>('.offer-link');
    expect(detailLink).not.toBeNull();
    expect(detailLink?.textContent).toContain('Ver detalle');
    expect(detailLink?.getAttribute('href')).toBe('/practicas/34');
  });

  it('should apply filters when the form is submitted', async () => {
    await configure();
    fixture.detectChanges();
    ofertasService.list.calls.reset();

    const compiled = fixture.nativeElement as HTMLElement;
    setInputValue(compiled, '#practicas-q', 'datos');
    setInputValue(compiled, '#practicas-familia', 'Informatica y comunicaciones');
    setInputValue(compiled, '#practicas-localidad', 'Valencia');
    setSelectValue(compiled, '#practicas-modalidad', 'HIBRIDA');

    compiled.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(ofertasService.list).toHaveBeenCalledWith({
      q: 'datos',
      familiaProfesional: 'Informatica y comunicaciones',
      localidad: 'Valencia',
      modalidad: 'HIBRIDA',
    });
  });

  it('should render the empty state', async () => {
    await configure(of([]));

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No hay ofertas con esos filtros');
  });

  it('should render an authentication error state', async () => {
    await configure(throwError(() => new HttpErrorResponse({ status: 401 })));

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Inicia sesión para consultar el catálogo');
  });
});

function setInputValue(compiled: HTMLElement, selector: string, value: string): void {
  const input = compiled.querySelector<HTMLInputElement>(selector);
  expect(input).not.toBeNull();

  input!.value = value;
  input!.dispatchEvent(new Event('input'));
}

function setSelectValue(compiled: HTMLElement, selector: string, value: string): void {
  const select = compiled.querySelector<HTMLSelectElement>(selector);
  expect(select).not.toBeNull();

  select!.value = value;
  select!.dispatchEvent(new Event('change'));
}
