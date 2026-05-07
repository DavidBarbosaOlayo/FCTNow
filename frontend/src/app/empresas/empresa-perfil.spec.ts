import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { EmpresaPerfil } from './empresa-perfil.models';
import { EmpresaPerfilService } from './empresa-perfil.service';
import { EmpresaPerfilPage } from './empresa-perfil';

describe('EmpresaPerfilPage', () => {
  let fixture: ComponentFixture<EmpresaPerfilPage>;
  let service: jasmine.SpyObj<EmpresaPerfilService>;

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

  async function configure({
    accessToken = 'token',
    profile = of(sampleEmpresa),
    platformId = 'browser',
  }: {
    accessToken?: string | null;
    profile?: Observable<EmpresaPerfil>;
    platformId?: string;
  } = {}): Promise<void> {
    service = jasmine.createSpyObj<EmpresaPerfilService>('EmpresaPerfilService', [
      'getMine',
      'updateMine',
    ]);
    service.getMine.and.returnValue(profile);
    service.updateMine.and.returnValue(of(sampleEmpresa));

    await TestBed.configureTestingModule({
      imports: [EmpresaPerfilPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: EmpresaPerfilService, useValue: service },
        { provide: AuthService, useValue: { accessToken: () => accessToken } },
        { provide: PLATFORM_ID, useValue: platformId },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmpresaPerfilPage);
  }

  it('should load and render the company profile', async () => {
    await configure();
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(service.getMine).toHaveBeenCalled();
    expect(compiled.textContent).toContain('Perfil de empresa');
    expect(compiled.textContent).toContain('Tech Norte');
    const nameInput = compiled.querySelector<HTMLInputElement>('input[formControlName="nombre"]');
    expect(nameInput?.value).toBe('Tech Norte');
  });

  it('should save the edited profile', async () => {
    await configure();
    fixture.detectChanges();

    const componentInstance = fixture.componentInstance;
    componentInstance['form'].patchValue({
      nombre: 'Tech Norte Actualizada',
      identificadorFiscal: ' B12345678 ',
      emailContacto: 'contacto@technorte.example',
    });

    componentInstance['save']();

    expect(service.updateMine).toHaveBeenCalledWith(
      jasmine.objectContaining({
        nombre: 'Tech Norte Actualizada',
        identificadorFiscal: 'B12345678',
        emailContacto: 'contacto@technorte.example',
      }),
    );
  });

  it('should show an authentication message without active session', async () => {
    await configure({ accessToken: null });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(service.getMine).not.toHaveBeenCalled();
    expect(compiled.textContent).toContain('Inicia sesion como empresa');
  });

  it('should show an error state when loading fails', async () => {
    await configure({ profile: throwError(() => new Error('boom')) });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No se pudo cargar tu perfil de empresa');
  });

  it('should avoid calling the backend during server rendering', async () => {
    await configure({ platformId: 'server' });
    fixture.detectChanges();

    expect(service.getMine).not.toHaveBeenCalled();
  });
});
