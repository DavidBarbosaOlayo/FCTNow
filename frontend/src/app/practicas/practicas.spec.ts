import { HttpErrorResponse } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AlumnoPreferenciasService } from '../alumnos/preferencias.service';
import { AuthService } from '../auth/auth.service';
import { TutorAlumnosService } from '../fct/tutor-alumnos.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { OfertaExternaPage } from './ofertas-externas.models';
import { OfertasExternasService } from './ofertas-externas.service';
import { OfertaFct } from './ofertas.models';
import { OfertasService } from './ofertas.service';
import { PracticasPage } from './practicas';
import { SolicitudExterna } from './solicitudes-externas.models';
import { SolicitudesExternasService } from './solicitudes-externas.service';

describe('PracticasPage', () => {
  let fixture: ComponentFixture<PracticasPage>;
  let ofertasService: jasmine.SpyObj<OfertasService>;
  let ofertasExternasService: jasmine.SpyObj<OfertasExternasService>;
  let solicitudesExternasService: jasmine.SpyObj<SolicitudesExternasService>;

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
    mineExternas: Observable<SolicitudExterna[]> = of([]),
  ): Promise<void> {
    ofertasService = jasmine.createSpyObj<OfertasService>('OfertasService', ['list']);
    ofertasService.list.and.returnValue(result);

    ofertasExternasService = jasmine.createSpyObj<OfertasExternasService>(
      'OfertasExternasService',
      ['list'],
    );
    ofertasExternasService.list.and.returnValue(externalResult);

    solicitudesExternasService = jasmine.createSpyObj<SolicitudesExternasService>(
      'SolicitudesExternasService',
      ['mine', 'create', 'changeEstado'],
    );
    solicitudesExternasService.mine.and.returnValue(mineExternas);
    solicitudesExternasService.create.and.callFake((payload) => of(buildSolicitud({
      idExterno: payload.idExterno,
      titulo: payload.titulo,
      estado: 'SOLICITADA',
    })));
    solicitudesExternasService.changeEstado.and.callFake((id, estado) => of(buildSolicitud({
      id,
      estado,
    })));

    await TestBed.configureTestingModule({
      imports: [PracticasPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: OfertasService, useValue: ofertasService },
        { provide: OfertasExternasService, useValue: ofertasExternasService },
        { provide: SolicitudesExternasService, useValue: solicitudesExternasService },
        {
          provide: AuthService,
          useValue: { currentUser: () => null, accessToken: () => null },
        },
        {
          provide: AlumnoPreferenciasService,
          useValue: { getMine: () => throwError(() => new Error('not used')) },
        },
        {
          provide: TutorAlumnosService,
          useValue: { list: () => of([]) },
        },
        {
          provide: NotificacionesService,
          useValue: { recomendar: () => of({}) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PracticasPage);
  }

  function buildSolicitud(overrides: Partial<SolicitudExterna>): SolicitudExterna {
    return {
      id: 9,
      alumnoId: 1,
      alumnoNombre: 'Alumno Demo',
      fuente: 'ADZUNA',
      idExterno: 'ad-9',
      titulo: 'Becario QA',
      empresaNombre: 'Logística Levante',
      localidad: 'Castellón',
      region: 'Comunidad Valenciana',
      urlAplicacion: 'https://www.adzuna.es/land/ad/9',
      publicadoEn: null,
      categoria: 'TI',
      estado: 'SOLICITADA',
      createdAt: '2026-05-01T08:00:00Z',
      updatedAt: '2026-05-01T08:00:00Z',
      actualizadoPorId: 1,
      ...overrides,
    };
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
    expect(ofertasExternasService.list).not.toHaveBeenCalled();
    expect(compiled.textContent).toContain('La modalidad solo se aplica a las ofertas FCT publicadas');
  });

  it('should enforce modalidad filtering on the internal list even if the API returns mixed offers', async () => {
    const remoteOffer: OfertaFct = {
      ...offer,
      id: 35,
      titulo: 'Practicas remotas de QA',
      modalidad: 'REMOTA',
    };

    await configure(of([offer, remoteOffer]));
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    setSelectValue(compiled, '#practicas-modalidad', 'REMOTA');

    compiled.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('Practicas remotas de QA');
    expect(compiled.textContent).not.toContain('Practicas de desarrollo web');
    expect(compiled.textContent).toContain('1 oferta disponible');
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

  it('should open a structured detail view for an external offer', async () => {
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
    const detailButton = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.trim() === 'Ver detalles',
    );
    detailButton!.click();
    fixture.detectChanges();

    const dialog = compiled.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain('Becario QA');
    expect(dialog.textContent).toContain('Logística Levante');
    expect(dialog.textContent).toContain('Identificador externo');
    expect(dialog.textContent).toContain('ad-9');
    expect(dialog.textContent).toContain('15.000');
    expect(dialog.textContent).toContain('20.000');

    const closeButton = dialog.querySelector<HTMLButtonElement>('.detail-close-action')!;
    closeButton.click();
    fixture.detectChanges();
    expect(compiled.querySelector('[role="dialog"]')).toBeNull();
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

  it('should let the alumno mark an external offer as solicitada and then aceptada', async () => {
    const externalOffer = {
      id: 'ad-9',
      fuente: 'ADZUNA',
      titulo: 'Becario QA',
      empresaNombre: 'Logística Levante',
      localidad: 'Castellón',
      region: 'Comunidad Valenciana',
      descripcion: '',
      categoria: 'TI',
      contratoTipo: null,
      jornada: null,
      salarioMinimo: null,
      salarioMaximo: null,
      salarioEstimado: null,
      publicadoEn: null,
      urlAplicacion: 'https://www.adzuna.es/land/ad/9',
    };
    await configure(of([offer]), of({
      ...externalPage,
      results: [externalOffer],
      totalResults: 1,
    }), of([]));
    spyOn(window, 'confirm').and.returnValue(true);

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const trackingLabel = compiled.querySelector<HTMLButtonElement>('.tracking-label');
    expect(trackingLabel).not.toBeNull();
    expect(trackingLabel?.textContent).toContain('Marcar como solicitada');

    trackingLabel!.click();
    fixture.detectChanges();

    expect(solicitudesExternasService.create).toHaveBeenCalledTimes(1);
    expect(solicitudesExternasService.create.calls.mostRecent().args[0].idExterno).toBe('ad-9');

    const solicitadaToggle = compiled.querySelector<HTMLButtonElement>('.tracking-toggle.is-estado-solicitada');
    expect(solicitadaToggle).not.toBeNull();
    expect(solicitadaToggle?.querySelector('.state')?.textContent?.trim()).toBe('Solicitada');
    expect(solicitadaToggle?.querySelector('.hover')?.textContent?.trim()).toBe('Anular solicitud');

    const aceptarBtn = compiled.querySelector<HTMLButtonElement>('.tracking-label.is-primary');
    expect(aceptarBtn).not.toBeNull();
    expect(aceptarBtn?.textContent?.trim()).toBe('Marcar aceptada');

    aceptarBtn!.click();
    fixture.detectChanges();

    expect(window.confirm).toHaveBeenCalled();
    expect(solicitudesExternasService.changeEstado).toHaveBeenCalledWith(9, 'ACEPTADA');
    const acceptedToggle = compiled.querySelector<HTMLButtonElement>('.tracking-toggle.is-estado-aceptada');
    expect(acceptedToggle).not.toBeNull();
    expect(acceptedToggle?.querySelector('.state')?.textContent?.trim()).toBe('Aceptada');
    expect(compiled.querySelector('.tracking-label.is-primary')).toBeNull();
  });

  it('should anular the solicitud when the corner toggle is clicked', async () => {
    const externalOffer = {
      id: 'ad-9',
      fuente: 'ADZUNA',
      titulo: 'Becario QA',
      empresaNombre: 'Logística Levante',
      localidad: 'Castellón',
      region: 'Comunidad Valenciana',
      descripcion: '',
      categoria: 'TI',
      contratoTipo: null,
      jornada: null,
      salarioMinimo: null,
      salarioMaximo: null,
      salarioEstimado: null,
      publicadoEn: null,
      urlAplicacion: 'https://www.adzuna.es/land/ad/9',
    };
    await configure(of([offer]), of({
      ...externalPage,
      results: [externalOffer],
      totalResults: 1,
    }), of([buildSolicitud({ idExterno: 'ad-9', estado: 'SOLICITADA' })]));
    spyOn(window, 'confirm').and.returnValue(true);

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const toggle = compiled.querySelector<HTMLButtonElement>('.tracking-toggle');
    expect(toggle).not.toBeNull();
    expect(toggle?.querySelector('.state')?.textContent?.trim()).toBe('Solicitada');

    toggle!.click();
    fixture.detectChanges();

    expect(window.confirm).toHaveBeenCalled();
    expect(solicitudesExternasService.changeEstado).toHaveBeenCalledWith(9, 'RETIRADA');

    const corner = compiled.querySelector<HTMLButtonElement>('.tracking-label');
    expect(corner?.textContent?.trim()).toBe('Marcar como solicitada');
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
