import { HttpErrorResponse } from '@angular/common/http';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { AlumnoPreferencias } from './preferencias.models';
import { AlumnoPreferenciasService } from './preferencias.service';
import { PreferenciasAlumnoPage } from './preferencias';

describe('PreferenciasAlumnoPage', () => {
  let fixture: ComponentFixture<PreferenciasAlumnoPage>;
  let authService: jasmine.SpyObj<AuthService>;
  let preferenciasService: jasmine.SpyObj<AlumnoPreferenciasService>;

  const samplePreferences: AlumnoPreferencias = {
    familiaProfesional: 'Informatica y comunicaciones',
    cicloFormativo: 'Desarrollo de Aplicaciones Web',
    localidadPreferida: 'Valencia',
    modalidadPreferida: 'HIBRIDA',
    fechaDisponibilidad: '2026-09-15',
    observaciones: 'Preferencia por desarrollo web.',
    hasCv: true,
    cvFileName: 'cv-alumno.pdf',
    cvContentType: 'application/pdf',
    cvSize: 2048,
    cvUpdatedAt: '2026-05-07T12:00:00Z',
  };

  async function configure({
    accessToken = 'jwt-token',
    result = of(samplePreferences) as Observable<AlumnoPreferencias>,
    platformId = 'browser',
  }: {
    accessToken?: string | null;
    result?: Observable<AlumnoPreferencias>;
    platformId?: string;
  } = {}): Promise<void> {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['accessToken']);
    authService.accessToken.and.returnValue(accessToken);

    preferenciasService = jasmine.createSpyObj<AlumnoPreferenciasService>(
      'AlumnoPreferenciasService',
      ['getMine', 'updateMine', 'uploadCv', 'downloadCv'],
    );
    preferenciasService.getMine.and.returnValue(result);
    preferenciasService.updateMine.and.returnValue(of(samplePreferences));
    preferenciasService.uploadCv.and.returnValue(of(samplePreferences));

    await TestBed.configureTestingModule({
      imports: [PreferenciasAlumnoPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: AlumnoPreferenciasService, useValue: preferenciasService },
        { provide: PLATFORM_ID, useValue: platformId },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PreferenciasAlumnoPage);
  }

  it('should render the preferences form with current values and CV state', async () => {
    await configure();

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(preferenciasService.getMine).toHaveBeenCalled();
    expect(compiled.textContent).toContain('Preferencias y CV');
    expect(compiled.textContent).toContain('cv-alumno.pdf');

    const familyInput = compiled.querySelector<HTMLInputElement>('input[formcontrolname="familiaProfesional"]');
    expect(familyInput?.value).toBe('Informatica y comunicaciones');
  });

  it('should save preferences with normalized empty values', async () => {
    await configure();
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const localityInput = compiled.querySelector<HTMLInputElement>('input[formcontrolname="localidadPreferida"]');
    localityInput!.value = '';
    localityInput!.dispatchEvent(new Event('input'));

    const form = compiled.querySelector<HTMLFormElement>('form')!;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(preferenciasService.updateMine).toHaveBeenCalledWith(
      jasmine.objectContaining({ localidadPreferida: null }),
    );
    expect(compiled.textContent).toContain('Preferencias guardadas');
  });

  it('should upload the selected CV', async () => {
    await configure();
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const file = new File(['pdf'], 'nuevo-cv.pdf', { type: 'application/pdf' });
    const input = compiled.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, 'files', {
      value: {
        0: file,
        length: 1,
        item: (index: number) => (index === 0 ? file : null),
      },
    });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const uploadButton = Array.from(compiled.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Subir CV'),
    ) as HTMLButtonElement;
    uploadButton.click();
    fixture.detectChanges();

    expect(preferenciasService.uploadCv).toHaveBeenCalledWith(file);
    expect(compiled.textContent).toContain('CV actualizado');
  });

  it('should render the not authenticated state when there is no session', async () => {
    await configure({ accessToken: null });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(preferenciasService.getMine).not.toHaveBeenCalled();
    expect(compiled.textContent).toContain('Inicia sesión para editar tus preferencias');
  });

  it('should render the error state when loading fails', async () => {
    await configure({
      result: throwError(() => new HttpErrorResponse({ status: 0 })),
    });

    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No se pudieron cargar tus preferencias');
    expect(compiled.textContent).toContain('backend esté disponible');
  });

  it('should avoid calling the backend during server rendering', async () => {
    await configure({ platformId: 'server' });

    fixture.detectChanges();

    expect(preferenciasService.getMine).not.toHaveBeenCalled();
  });
});
