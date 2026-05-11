import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../core/api/api.config';
import { AlumnoPreferencias, AlumnoPreferenciasRequest } from './preferencias.models';
import { AlumnoPreferenciasService } from './preferencias.service';

describe('AlumnoPreferenciasService', () => {
  let httpTesting: HttpTestingController;

  const samplePreferences: AlumnoPreferencias = {
    familiaProfesional: 'Informatica y comunicaciones',
    cicloFormativo: 'Desarrollo de Aplicaciones Web',
    localidadPreferida: 'Valencia',
    modalidadPreferida: 'HIBRIDA',
    fechaDisponibilidad: '2026-09-15',
    observaciones: 'Preferencia por desarrollo web.',
    hasCv: true,
    cvFileName: 'cv.pdf',
    cvContentType: 'application/pdf',
    cvSize: 1234,
    cvUpdatedAt: '2026-05-07T12:00:00Z',
    hasPhoto: true,
    photoDataUrl: 'data:image/png;base64,aW1n',
    photoContentType: 'image/png',
    photoSize: 321,
    photoUpdatedAt: '2026-05-08T12:00:00Z',
  };

  const requestBody: AlumnoPreferenciasRequest = {
    familiaProfesional: 'Informatica y comunicaciones',
    cicloFormativo: 'DAW',
    localidadPreferida: 'Valencia',
    modalidadPreferida: 'PRESENCIAL',
    fechaDisponibilidad: '2026-09-15',
    observaciones: null,
  };

  function configure(accessToken: string | null = 'token'): AlumnoPreferenciasService {
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
    return TestBed.inject(AlumnoPreferenciasService);
  }

  afterEach(() => httpTesting?.verify());

  it('should get authenticated alumno preferences', () => {
    const service = configure();
    service.getMine().subscribe((preferences) => {
      expect(preferences.hasCv).toBeTrue();
      expect(preferences.familiaProfesional).toBe('Informatica y comunicaciones');
    });

    const request = httpTesting.expectOne('/api/alumnos/me/preferencias');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token');
    request.flush(samplePreferences);
  });

  it('should update authenticated alumno preferences', () => {
    const service = configure();
    service.updateMine(requestBody).subscribe();

    const request = httpTesting.expectOne('/api/alumnos/me/preferencias');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(requestBody);
    request.flush({ ...samplePreferences, ...requestBody });
  });

  it('should upload a CV as multipart form data', () => {
    const service = configure();
    const file = new File(['pdf'], 'cv.pdf', { type: 'application/pdf' });
    service.uploadCv(file).subscribe();

    const request = httpTesting.expectOne('/api/alumnos/me/cv');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body instanceof FormData).toBeTrue();
    request.flush(samplePreferences);
  });

  it('should upload a profile photo as multipart form data', () => {
    const service = configure();
    const file = new File(['img'], 'foto.png', { type: 'image/png' });
    service.uploadPhoto(file).subscribe();

    const request = httpTesting.expectOne('/api/alumnos/me/foto');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body instanceof FormData).toBeTrue();
    request.flush(samplePreferences);
  });

  it('should download the current CV', () => {
    const service = configure();
    service.downloadCv().subscribe((blob) => {
      expect(blob.size).toBe(3);
    });

    const request = httpTesting.expectOne('/api/alumnos/me/cv');
    expect(request.request.method).toBe('GET');
    request.flush(new Blob(['pdf'], { type: 'application/pdf' }));
  });

  it('should fail before calling the API when there is no session', () => {
    const service = configure(null);

    service.getMine().subscribe({
      next: () => fail('expected error'),
      error: (error: unknown) => expect(error).toEqual(jasmine.any(Error)),
    });

    httpTesting.expectNone('/api/alumnos/me/preferencias');
  });
});
