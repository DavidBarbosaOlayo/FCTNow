import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../core/api/api.config';
import { EmpresaPerfil, EmpresaPerfilRequest } from './empresa-perfil.models';
import { EmpresaPerfilService } from './empresa-perfil.service';

describe('EmpresaPerfilService', () => {
  let httpTesting: HttpTestingController;

  const sampleEmpresa: EmpresaPerfil = {
    id: 5,
    nombre: 'Tech Norte',
    tipoIdentificadorFiscal: 'CIF',
    identificadorFiscal: 'B12345678',
    sector: 'Informatica',
    descripcion: 'Empresa colaboradora',
    direccion: 'Calle Mayor 12',
    localidad: 'Valencia',
    provincia: 'Valencia',
    codigoPostal: '46001',
    emailContacto: 'fct@technorte.example',
    telefonoContacto: '960000000',
    personaContacto: 'Laura Garcia',
    estado: 'ACTIVA',
    createdAt: '2026-05-06T10:00:00Z',
    updatedAt: '2026-05-06T10:00:00Z',
  };

  const validRequest: EmpresaPerfilRequest = {
    nombre: 'Tech Norte',
    tipoIdentificadorFiscal: 'CIF',
    identificadorFiscal: 'B12345678',
    sector: 'Informatica',
    descripcion: 'Empresa colaboradora',
    direccion: 'Calle Mayor 12',
    localidad: 'Valencia',
    provincia: 'Valencia',
    codigoPostal: '46001',
    emailContacto: 'fct@technorte.example',
    telefonoContacto: '960000000',
    personaContacto: 'Laura Garcia',
  };

  function configure(accessToken: string | null = 'token'): EmpresaPerfilService {
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
    return TestBed.inject(EmpresaPerfilService);
  }

  afterEach(() => httpTesting?.verify());

  it('should load the authenticated company profile with bearer token', () => {
    const service = configure();
    service.getMine().subscribe((empresa) => {
      expect(empresa.id).toBe(5);
      expect(empresa.nombre).toBe('Tech Norte');
    });

    const request = httpTesting.expectOne('/api/empresas/me');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token');
    request.flush(sampleEmpresa);
  });

  it('should update the authenticated company profile', () => {
    const service = configure();
    service.updateMine(validRequest).subscribe((empresa) => {
      expect(empresa.estado).toBe('ACTIVA');
    });

    const request = httpTesting.expectOne('/api/empresas/me');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(validRequest);
    request.flush(sampleEmpresa);
  });

  it('should fail before calling the API when there is no session', () => {
    const service = configure(null);

    service.getMine().subscribe({
      next: () => fail('expected error'),
      error: (error: unknown) => expect(error).toEqual(jasmine.any(Error)),
    });

    httpTesting.expectNone('/api/empresas/me');
  });
});
