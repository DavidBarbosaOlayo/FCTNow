import { HttpErrorResponse } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { OfertaExternaPage } from './ofertas-externas.models';
import { OfertasExternasService } from './ofertas-externas.service';
import { OfertaFct } from './ofertas.models';
import { OfertasService } from './ofertas.service';
import { PracticasPage } from './practicas';

describe('PracticasPage', () => {
  let fixture: ComponentFixture<PracticasPage>;
  let ofertasService: jasmine.SpyObj<OfertasService>;
  let ofertasExternasService: jasmine.SpyObj<OfertasExternasService>;

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

  const externalPage: OfertaExternaPage = {
    results: [],
    page: 1,
    resultsPerPage: 20,
    totalResults: 0,
    attribution: 'Resultados ofrecidos por Adzuna',
    attributionUrl: 'https://www.adzuna.es/',
  };

  async function configure(
    result: Observable<OfertaFct[]> = of([offer]),
    externalResult: Observable<OfertaExternaPage> = of(externalPage),
  ): Promise<void> {
    ofertasService = jasmine.createSpyObj<OfertasService>('OfertasService', ['list']);
    ofertasService.list.and.returnValue(result);

    ofertasExternasService = jasmine.createSpyObj<OfertasExternasService>(
      'OfertasExternasService',
      ['list'],
    );
    ofertasExternasService.list.and.returnValue(externalResult);

    await TestBed.configureTestingModule({
      imports: [PracticasPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: OfertasService, useValue: ofertasService },
        { provide: OfertasExternasService, useValue: ofertasExternasService },
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
    ofertasExternasService.list.calls.reset();

    const compiled = fixture.nativeElement as HTMLElement;
    setInputValue(compiled, '#practicas-q', 'datos');
    setSelectValue(compiled, '#practicas-familia', 'Informática y comunicaciones');
    setSelectValue(compiled, '#practicas-localidad', 'Valencia');
    setSelectValue(compiled, '#practicas-modalidad', 'HIBRIDA');

    compiled.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(ofertasService.list).toHaveBeenCalledWith({
      q: 'datos',
      familiaProfesional: 'Informática y comunicaciones',
      localidad: 'Valencia',
      modalidad: 'HIBRIDA',
    });
    expect(ofertasExternasService.list).toHaveBeenCalledWith({
      q: 'datos',
      where: 'Valencia',
      category: 'it-jobs',
      page: 1,
      resultsPerPage: 21,
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

  it('should render external offers from Adzuna with attribution and external link', async () => {
    await configure(of([offer]), of({
      ...externalPage,
      results: [
        {
          id: 'ad-9',
          fuente: 'ADZUNA',
          titulo: 'Becario QA',
          empresaNombre: 'Logística Levante',
          localidad: 'Castellón',
          region: 'Comunidad Valenciana',
          descripcion: 'Apoyo en pruebas funcionales',
          categoria: 'TI',
          contratoTipo: 'permanent',
          jornada: 'full_time',
          salarioMinimo: 15000,
          salarioMaximo: 20000,
          salarioEstimado: false,
          publicadoEn: '2026-04-12T08:00:00Z',
          urlAplicacion: 'https://www.adzuna.es/land/ad/9',
        },
      ],
      totalResults: 1,
    }));

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const externaSection = compiled.querySelector('.catalog-results-externas') as HTMLElement;
    expect(externaSection).not.toBeNull();
    expect(externaSection.textContent).toContain('Becario QA');
    expect(externaSection.textContent).toContain('Logística Levante');
    expect(externaSection.textContent).toContain('Adzuna');

    const externalLink = externaSection.querySelector<HTMLAnchorElement>('.offer-link');
    expect(externalLink?.getAttribute('href')).toBe('https://www.adzuna.es/land/ad/9');
    expect(externalLink?.getAttribute('target')).toBe('_blank');
    expect(externalLink?.getAttribute('rel')).toContain('noopener');

    const attribution = externaSection.querySelector<HTMLAnchorElement>('.adzuna-attribution a');
    expect(attribution?.getAttribute('href')).toBe('https://www.adzuna.es/');
    expect(attribution?.textContent).toContain('Adzuna');
  });

  it('should append a second page when "Cargar más" is clicked', async () => {
    const buildOffer = (id: string, titulo: string) => ({
      id,
      fuente: 'ADZUNA',
      titulo,
      empresaNombre: 'Empresa',
      localidad: 'Madrid',
      region: 'Madrid',
      descripcion: '',
      categoria: 'TI',
      contratoTipo: null,
      jornada: null,
      salarioMinimo: null,
      salarioMaximo: null,
      salarioEstimado: null,
      publicadoEn: null,
      urlAplicacion: `https://adzuna/${id}`,
    });
    const firstPage = {
      ...externalPage,
      results: [buildOffer('1', 'A'), buildOffer('2', 'B')],
      page: 1,
      totalResults: 4,
    };
    const secondPage = {
      ...externalPage,
      results: [buildOffer('3', 'C'), buildOffer('4', 'D')],
      page: 2,
      totalResults: 4,
    };

    await configure(of([offer]), of(firstPage));
    fixture.detectChanges();
    fixture.detectChanges();

    expect(ofertasExternasService.list).toHaveBeenCalledTimes(1);
    const compiled = fixture.nativeElement as HTMLElement;
    const externaSection = compiled.querySelector('.catalog-results-externas') as HTMLElement;
    expect(externaSection.querySelectorAll('.offer-card-externa').length).toBe(2);

    ofertasExternasService.list.and.returnValue(of(secondPage));
    const loadMore = compiled.querySelector<HTMLButtonElement>('.load-more-action');
    expect(loadMore).not.toBeNull();
    expect(loadMore?.textContent).toContain('Cargar más');
    loadMore!.click();
    fixture.detectChanges();

    expect(ofertasExternasService.list).toHaveBeenCalledTimes(2);
    const lastCall = ofertasExternasService.list.calls.mostRecent().args[0];
    expect(lastCall?.page).toBe(2);
    expect(lastCall?.resultsPerPage).toBe(21);

    expect(externaSection.querySelectorAll('.offer-card-externa').length).toBe(4);
    expect(compiled.querySelector('.load-more-action')).toBeNull();
  });

  it('should show a non-blocking error state for external offers when Adzuna is unavailable', async () => {
    await configure(of([offer]), throwError(() => new HttpErrorResponse({ status: 503 })));

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Tech Norte Formacion');
    const externaSection = compiled.querySelector('.catalog-results-externas') as HTMLElement;
    expect(externaSection.textContent).toContain('La fuente externa no está disponible');
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
