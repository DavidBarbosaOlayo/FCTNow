import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../core/api/api.config';
import { EmpresaSolicitud } from './empresa-solicitudes.models';
import { EmpresaSolicitudesService } from './empresa-solicitudes.service';

describe('EmpresaSolicitudesService', () => {
  let httpTesting: HttpTestingController;

  const sampleSolicitud: EmpresaSolicitud = {
    id: 1,
    estado: 'SOLICITADA',
    createdAt: '2026-05-08T10:00:00Z',
    oferta: { id: 9, titulo: 'Practicas web', estado: 'PUBLICADA' },
    alumno: { id: 7, displayName: 'Alumno Demo', email: 'alumno@example.com' },
  };

  function configure(accessToken: string | null = 'token'): EmpresaSolicitudesService {
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
    return TestBed.inject(EmpresaSolicitudesService);
  }

  afterEach(() => httpTesting?.verify());

  it('should list received solicitudes with bearer token', () => {
    const service = configure();
    service.listMine().subscribe((items) => {
      expect(items.length).toBe(1);
      expect(items[0].id).toBe(1);
    });

    const request = httpTesting.expectOne('/api/empresas/me/solicitudes');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token');
    request.flush([sampleSolicitud]);
  });

  it('should change a solicitud estado with PATCH', () => {
    const service = configure();
    service.changeEstado(7, 'ACEPTADA').subscribe();

    const request = httpTesting.expectOne('/api/empresas/me/solicitudes/7/estado');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ estado: 'ACEPTADA' });
    request.flush({ ...sampleSolicitud, estado: 'ACEPTADA' });
  });

  it('should fail before calling the API when there is no session', () => {
    const service = configure(null);

    service.listMine().subscribe({
      next: () => fail('expected error'),
      error: (error: unknown) => expect(error).toEqual(jasmine.any(Error)),
    });

    httpTesting.expectNone('/api/empresas/me/solicitudes');
  });
});
