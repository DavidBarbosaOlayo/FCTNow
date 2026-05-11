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
    sector: 'Informática y comunicaciones',
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

  function clickEditar(compiled: HTMLElement): void {
    const button = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button')).find(
      (btn) => btn.textContent?.trim() === 'Editar perfil',
    );
    button?.click();
    fixture.detectChanges();
  }

  it('should load and render the company profile in view mode by default', async () => {
    await configure();
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(service.getMine).toHaveBeenCalled();
    expect(compiled.querySelector('.route-hero')).toBeNull();
    expect(compiled.textContent).toContain('Tech Norte');
    expect(compiled.textContent).toContain('B12345678');
    expect(compiled.textContent).toContain('fct@technorte.example');
    expect(compiled.querySelector('form')).toBeNull();
  });

  it('should switch to edit mode when the Editar button is clicked', async () => {
    await configure();
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    clickEditar(compiled);

    const nameInput = compiled.querySelector<HTMLInputElement>('input[formControlName="nombre"]');
    expect(nameInput?.value).toBe('Tech Norte');
  });

  it('should save the edited profile and return to view mode', async () => {
    await configure();
    fixture.detectChanges();
    fixture.detectChanges();

    const componentInstance = fixture.componentInstance;
    const compiled = fixture.nativeElement as HTMLElement;
    clickEditar(compiled);

    componentInstance['form'].patchValue({
      nombre: 'Tech Norte Actualizada',
      identificadorFiscal: ' B12345678 ',
      emailContacto: 'contacto@technorte.example',
    });

    componentInstance['save']();
    fixture.detectChanges();

    expect(service.updateMine).toHaveBeenCalledWith(
      jasmine.objectContaining({
        nombre: 'Tech Norte Actualizada',
        identificadorFiscal: 'B12345678',
        emailContacto: 'contacto@technorte.example',
      }),
    );
    expect(compiled.querySelector('form')).toBeNull();
    expect(compiled.textContent).toContain('Perfil de empresa guardado');
  });

  it('should revert changes when cancelEdit is clicked', async () => {
    await configure();
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    clickEditar(compiled);

    const nameInput = compiled.querySelector<HTMLInputElement>('input[formControlName="nombre"]');
    nameInput!.value = 'Cambiado en memoria';
    nameInput!.dispatchEvent(new Event('input'));

    const cancelButton = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button')).find(
      (btn) => btn.textContent?.trim() === 'Cancelar',
    );
    cancelButton?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('form')).toBeNull();
    expect(compiled.textContent).toContain('Tech Norte');
    expect(service.updateMine).not.toHaveBeenCalled();
  });

  it('should show an authentication message without active session', async () => {
    await configure({ accessToken: null });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(service.getMine).not.toHaveBeenCalled();
    expect(compiled.textContent).toContain('Inicia sesión como empresa');
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
