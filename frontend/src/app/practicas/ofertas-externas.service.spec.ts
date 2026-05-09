import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../core/api/api.config';
import { OfertasExternasService } from './ofertas-externas.service';

describe('OfertasExternasService', () => {
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

  it('should request external offers with trimmed filters and bearer token', () => {
    const service = TestBed.inject(OfertasExternasService);

    service
      .list({ q: ' developer ', where: ' Valencia ', category: ' it-jobs ', page: 2, resultsPerPage: 30 })
      .subscribe((response) => {
        expect(response.results).toEqual([]);
        expect(response.attribution).toBe('Resultados ofrecidos por Adzuna');
      });

    const request = httpTesting.expectOne((candidate) => candidate.url === '/api/ofertas/externas');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    expect(request.request.params.get('q')).toBe('developer');
    expect(request.request.params.get('where')).toBe('Valencia');
    expect(request.request.params.get('category')).toBe('it-jobs');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('resultsPerPage')).toBe('30');

    request.flush({
      results: [],
      page: 2,
      resultsPerPage: 30,
      totalResults: 0,
      attribution: 'Resultados ofrecidos por Adzuna',
      attributionUrl: 'https://www.adzuna.es/',
    });
  });

  it('should omit empty filters', () => {
    const service = TestBed.inject(OfertasExternasService);

    service.list({}).subscribe();

    const request = httpTesting.expectOne((candidate) => candidate.url === '/api/ofertas/externas');
    expect(request.request.params.keys()).toEqual([]);

    request.flush({
      results: [],
      page: 1,
      resultsPerPage: 20,
      totalResults: 0,
      attribution: 'Resultados ofrecidos por Adzuna',
      attributionUrl: 'https://www.adzuna.es/',
    });
  });
});
