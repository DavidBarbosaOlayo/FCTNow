import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../core/api/api.config';
import { AsignacionFct } from './asignaciones.models';
import { AsignacionesService } from './asignaciones.service';

describe('AsignacionesService', () => {
  let httpTesting: HttpTestingController;

  const sampleAsignacion: AsignacionFct = {
    id: 11,
    estado: 'ACTIVA',
    fechaAsignacion: '2026-05-08T10:00:00Z',
    observaciones: 'Inicia el lunes',
    solicitudId: 5,
    alumno: { id: 7, displayName: 'Alumno Demo', email: 'alumno@example.com' },
    oferta: { id: 9, titulo: 'Practicas web' },
    empresa: { id: 3, nombre: 'Tech Norte' },
  };

  function configure(accessToken: string | null = 'token'): AsignacionesService {
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
    return TestBed.inject(AsignacionesService);
  }

  afterEach(() => httpTesting?.verify());

  it('should list assignments with bearer token', () => {
    const service = configure();
    service.list().subscribe((items) => {
      expect(items.length).toBe(1);
      expect(items[0].alumno.email).toBe('alumno@example.com');
    });

    const request = httpTesting.expectOne('/api/asignaciones');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token');
    request.flush([sampleAsignacion]);
  });

  it('should list candidate solicitudes with bearer token', () => {
    const service = configure();
    service.listCandidatas().subscribe((items) => {
      expect(items.length).toBe(1);
      expect(items[0].solicitudId).toBe(5);
    });

    const request = httpTesting.expectOne('/api/asignaciones/candidatas');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token');
    request.flush([
      {
        solicitudId: 5,
        solicitadaEn: '2026-05-08T09:00:00Z',
        alumno: { id: 7, displayName: 'Alumno Demo', email: 'alumno@example.com' },
        oferta: { id: 9, titulo: 'Practicas web' },
        empresa: { id: 3, nombre: 'Tech Norte' },
      },
    ]);
  });

  it('should create an assignment with POST', () => {
    const service = configure();
    service
      .create({ solicitudId: 5, observaciones: 'Inicia el lunes' })
      .subscribe();

    const request = httpTesting.expectOne('/api/asignaciones');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ solicitudId: 5, observaciones: 'Inicia el lunes' });
    request.flush(sampleAsignacion);
  });

  it('should fail before calling the API when there is no session', () => {
    const service = configure(null);

    service.list().subscribe({
      next: () => fail('expected error'),
      error: (error: unknown) => expect(error).toEqual(jasmine.any(Error)),
    });

    httpTesting.expectNone('/api/asignaciones');
  });
});
