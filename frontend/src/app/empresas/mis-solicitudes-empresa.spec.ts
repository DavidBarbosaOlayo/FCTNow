import { HttpErrorResponse } from '@angular/common/http';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { EmpresaSolicitud } from './empresa-solicitudes.models';
import { EmpresaSolicitudesService } from './empresa-solicitudes.service';
import { MisSolicitudesEmpresaPage } from './mis-solicitudes-empresa';

describe('MisSolicitudesEmpresaPage', () => {
  let fixture: ComponentFixture<MisSolicitudesEmpresaPage>;
  let service: jasmine.SpyObj<EmpresaSolicitudesService>;

  const sampleSolicitudes: EmpresaSolicitud[] = [
    {
      id: 1,
      estado: 'SOLICITADA',
      createdAt: '2026-05-08T10:00:00Z',
      oferta: { id: 9, titulo: 'Practicas web', estado: 'PUBLICADA' },
      alumno: { id: 7, displayName: 'Alumno A', email: 'alumno-a@example.com' },
    },
    {
      id: 2,
      estado: 'ACEPTADA',
      createdAt: '2026-05-07T10:00:00Z',
      oferta: { id: 9, titulo: 'Practicas web', estado: 'PUBLICADA' },
      alumno: { id: 8, displayName: 'Alumno B', email: 'alumno-b@example.com' },
    },
  ];

  async function configure({
    result = of(sampleSolicitudes) as Observable<EmpresaSolicitud[]>,
    platformId = 'browser',
  }: {
    result?: Observable<EmpresaSolicitud[]>;
    platformId?: string;
  } = {}): Promise<void> {
    service = jasmine.createSpyObj<EmpresaSolicitudesService>('EmpresaSolicitudesService', [
      'listMine',
      'changeEstado',
    ]);
    service.listMine.and.returnValue(result);

    await TestBed.configureTestingModule({
      imports: [MisSolicitudesEmpresaPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: EmpresaSolicitudesService, useValue: service },
        { provide: PLATFORM_ID, useValue: platformId },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MisSolicitudesEmpresaPage);
  }

  it('should render the received solicitudes list', async () => {
    await configure();
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(service.listMine).toHaveBeenCalled();
    expect(compiled.textContent).toContain('Alumno A');
    expect(compiled.textContent).toContain('Alumno B');
    expect(compiled.textContent).toContain('Practicas web');
    expect(compiled.textContent).toContain('2 solicitudes recibidas');
  });

  it('should expose accept/reject buttons only for SOLICITADA', async () => {
    await configure();
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(compiled.querySelectorAll('button')).map(
      (btn) => btn.textContent?.trim() ?? '',
    );
    const acceptCount = buttons.filter((label) => label === 'Aceptar').length;
    const rejectCount = buttons.filter((label) => label === 'Rechazar').length;
    expect(acceptCount).toBe(1);
    expect(rejectCount).toBe(1);
  });

  it('should call changeEstado when Aceptar is clicked', async () => {
    service = jasmine.createSpyObj<EmpresaSolicitudesService>('EmpresaSolicitudesService', [
      'listMine',
      'changeEstado',
    ]);
    service.listMine.and.returnValue(of(sampleSolicitudes));
    service.changeEstado.and.returnValue(
      of({ ...sampleSolicitudes[0], estado: 'ACEPTADA' }),
    );

    await TestBed.configureTestingModule({
      imports: [MisSolicitudesEmpresaPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: EmpresaSolicitudesService, useValue: service },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MisSolicitudesEmpresaPage);
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const acceptButton = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button')).find(
      (btn) => btn.textContent?.trim() === 'Aceptar',
    );
    acceptButton?.click();
    fixture.detectChanges();

    expect(service.changeEstado).toHaveBeenCalledWith(1, 'ACEPTADA');
    expect(compiled.textContent).toContain('Solicitud aceptada');
  });

  it('should render the empty state when there are no solicitudes', async () => {
    await configure({ result: of([]) });
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Aun no has recibido solicitudes');
  });

  it('should render the not authenticated state on 401', async () => {
    await configure({
      result: throwError(() => new HttpErrorResponse({ status: 401 })),
    });
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Inicia sesion para gestionar las solicitudes');
  });

  it('should render the error state on network failure', async () => {
    await configure({
      result: throwError(() => new HttpErrorResponse({ status: 0 })),
    });
    fixture.detectChanges();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No se pudieron cargar las solicitudes');
  });

  it('should avoid calling the backend during server rendering', async () => {
    await configure({ platformId: 'server' });
    fixture.detectChanges();

    expect(service.listMine).not.toHaveBeenCalled();
  });
});
