import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../core/api/api.config';
import { HomeService } from './home.service';

describe('HomeService', () => {
  let httpTesting: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['accessToken']);

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

  it('should request the authenticated student home feed', () => {
    authService.accessToken.and.returnValue('jwt-token');
    const service = TestBed.inject(HomeService);

    service.getStudentFeed().subscribe((feed) => {
      expect(feed.recommendedOffers.length).toBe(0);
    });

    const request = httpTesting.expectOne('/api/alumnos/me/home');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');

    request.flush({
      student: {
        displayName: 'Ana Ruiz',
        familiaProfesional: 'Informática y comunicaciones',
        cicloFormativo: 'Desarrollo de Aplicaciones Web',
        localidadPreferida: 'Valencia',
        modalidadPreferida: 'HIBRIDA',
        preferenciasCompletas: true,
      },
      recommendedOffers: [],
      peerActivity: [],
      announcements: [],
    });
  });

  it('should fail before calling the API when there is no active session', () => {
    authService.accessToken.and.returnValue(null);
    const service = TestBed.inject(HomeService);
    let message = '';

    service.getStudentFeed().subscribe({
      error: (error: Error) => {
        message = error.message;
      },
    });

    expect(message).toContain('sesión activa');
    httpTesting.expectNone('/api/alumnos/me/home');
  });
});
