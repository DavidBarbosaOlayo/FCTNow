import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../core/api/api.config';
import { OfertaFct } from '../practicas/ofertas.models';
import { OfertaFctRequest } from './empresa-ofertas.models';
import { EmpresaOfertasService } from './empresa-ofertas.service';

describe('EmpresaOfertasService', () => {
  let httpTesting: HttpTestingController;

  const sampleOferta: OfertaFct = {
    id: 1,
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

  const validRequest: OfertaFctRequest = {
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
  };

  function configure(accessToken: string | null = 'token'): EmpresaOfertasService {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        {
          provide: AuthService,
          useValue: {
            accessToken: () => accessToken,
          },
        },
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    return TestBed.inject(EmpresaOfertasService);
  }

  afterEach(() => httpTesting?.verify());

  it('should list authenticated company offers with bearer token', () => {
    const service = configure();
    service.listMine().subscribe((ofertas) => {
      expect(ofertas.length).toBe(1);
      expect(ofertas[0].id).toBe(1);
    });

    const request = httpTesting.expectOne('/api/empresas/me/ofertas');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token');
    request.flush([sampleOferta]);
  });

  it('should create a new offer', () => {
    const service = configure();
    service.create(validRequest).subscribe((oferta) => {
      expect(oferta.estado).toBe('BORRADOR');
    });

    const request = httpTesting.expectOne('/api/empresas/me/ofertas');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(validRequest);
    request.flush(sampleOferta);
  });

  it('should update an offer by id', () => {
    const service = configure();
    service.update(7, validRequest).subscribe();

    const request = httpTesting.expectOne('/api/empresas/me/ofertas/7');
    expect(request.request.method).toBe('PUT');
    request.flush(sampleOferta);
  });

  it('should change an offer estado with PATCH', () => {
    const service = configure();
    service.changeEstado(7, 'PUBLICADA').subscribe();

    const request = httpTesting.expectOne('/api/empresas/me/ofertas/7/estado');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ estado: 'PUBLICADA' });
    request.flush({ ...sampleOferta, estado: 'PUBLICADA' });
  });

  it('should delete an offer by id', () => {
    const service = configure();
    service.delete(7).subscribe();

    const request = httpTesting.expectOne('/api/empresas/me/ofertas/7');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });

  it('should fail before calling the API when there is no session', () => {
    const service = configure(null);

    service.listMine().subscribe({
      next: () => fail('expected error'),
      error: (error: unknown) => expect(error).toEqual(jasmine.any(Error)),
    });

    httpTesting.expectNone('/api/empresas/me/ofertas');
  });
});
