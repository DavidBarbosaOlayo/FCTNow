import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../core/api/api.config';
import { OfertasService } from './ofertas.service';

describe('OfertasService', () => {
  let httpTesting: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['accessToken']);
    authService.accessToken.and.returnValue('jwt-token');

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/' },
        { provide: AuthService, useValue: authService },
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should list published offers with trimmed filters and bearer token', () => {
    const service = TestBed.inject(OfertasService);

    service
      .list({
        q: ' datos ',
        familiaProfesional: ' Informatica y comunicaciones ',
        localidad: ' Valencia ',
        modalidad: 'HIBRIDA',
      })
      .subscribe((response) => {
        expect(response).toEqual([]);
      });

    const request = httpTesting.expectOne((candidate) => candidate.url === '/api/ofertas');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    expect(request.request.params.get('q')).toBe('datos');
    expect(request.request.params.get('familiaProfesional')).toBe('Informatica y comunicaciones');
    expect(request.request.params.get('localidad')).toBe('Valencia');
    expect(request.request.params.get('modalidad')).toBe('HIBRIDA');

    request.flush([]);
  });

  it('should request a published offer detail', () => {
    const service = TestBed.inject(OfertasService);

    service.detail(34).subscribe();

    const request = httpTesting.expectOne('/api/ofertas/34');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');

    request.flush({
      id: 34,
      empresaId: 15,
      empresaNombre: 'Tech Norte Formacion',
      titulo: 'Practicas de desarrollo web',
      descripcion: 'Apoyo al equipo de desarrollo.',
      familiaProfesional: 'Informatica y comunicaciones',
      cicloFormativo: 'Desarrollo de Aplicaciones Web',
      localidad: 'Valencia',
      provincia: 'Valencia',
      modalidad: 'PRESENCIAL',
      fechaInicio: '2026-09-15',
      fechaFin: '2026-12-15',
      plazas: 2,
      requisitos: null,
      tareas: 'Maquetacion y pruebas funcionales.',
      estado: 'PUBLICADA',
      createdAt: '2026-05-04T12:00:00Z',
      updatedAt: '2026-05-04T12:00:00Z',
    });
  });
});
