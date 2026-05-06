import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../core/api/api.config';
import { SolicitudesService } from './solicitudes.service';

describe('SolicitudesService', () => {
  let httpTesting: HttpTestingController;

  function configure(accessToken: string | null = 'token'): SolicitudesService {
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
    return TestBed.inject(SolicitudesService);
  }

  afterEach(() => {
    httpTesting?.verify();
  });

  it('should list current user applications with bearer token', () => {
    const service = configure();

    service.mine().subscribe((solicitudes) => {
      expect(solicitudes.length).toBe(1);
      expect(solicitudes[0].ofertaId).toBe(34);
    });

    const request = httpTesting.expectOne('/api/solicitudes/me');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token');
    request.flush([
      {
        id: 1,
        ofertaId: 34,
        ofertaTitulo: 'Practicas de desarrollo web',
        empresaNombre: 'Tech Norte Formacion',
        estado: 'SOLICITADA',
        createdAt: '2026-05-06T10:00:00Z',
      },
    ]);
  });

  it('should request an offer with bearer token', () => {
    const service = configure();

    service.requestOffer(34).subscribe((solicitud) => {
      expect(solicitud.estado).toBe('SOLICITADA');
    });

    const request = httpTesting.expectOne('/api/ofertas/34/solicitudes');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token');
    expect(request.request.body).toEqual({});
    request.flush({
      id: 1,
      ofertaId: 34,
      ofertaTitulo: 'Practicas de desarrollo web',
      empresaNombre: 'Tech Norte Formacion',
      estado: 'SOLICITADA',
      createdAt: '2026-05-06T10:00:00Z',
    });
  });

  it('should fail before calling the API when there is no session', () => {
    const service = configure(null);

    service.mine().subscribe({
      next: () => fail('expected an error'),
      error: (error: unknown) => {
        expect(error).toEqual(jasmine.any(Error));
      },
    });

    httpTesting.expectNone('/api/solicitudes/me');
  });
});
