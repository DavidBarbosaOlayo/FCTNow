import { provideZonelessChangeDetection, Type } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminPage } from './admin/admin';
import { AlumnoPage } from './alumnos/alumno';
import { LoginPage } from './auth/login';
import { EmpresaPage } from './empresas/empresa';
import { CoordinadorPage } from './fct/coordinador';
import { TutorPage } from './fct/tutor';
import { MensajesPage } from './mensajes/mensajes';
import { NotificacionesPage } from './notificaciones/notificaciones';
import { NotFoundPage } from './not-found/not-found';
import { PerfilPage } from './perfil/perfil';
import { PracticasPage } from './practicas/practicas';

type RoutePageCase = {
  component: Type<unknown>;
  expectedText: string;
};

describe('route placeholder pages', () => {
  const pageCases: RoutePageCase[] = [
    { component: LoginPage, expectedText: 'Entrada a FCTNow' },
    { component: PracticasPage, expectedText: 'Búsqueda de prácticas' },
    { component: MensajesPage, expectedText: 'Mensajería de FCTNow' },
    { component: NotificacionesPage, expectedText: 'Centro de notificaciones' },
    { component: PerfilPage, expectedText: 'Perfil de usuario' },
    { component: AlumnoPage, expectedText: 'Panel inicial del alumno' },
    { component: EmpresaPage, expectedText: 'Panel inicial de empresa' },
    { component: TutorPage, expectedText: 'Panel inicial del tutor' },
    { component: CoordinadorPage, expectedText: 'Panel inicial de coordinación' },
    { component: AdminPage, expectedText: 'Panel inicial de administración' },
    { component: NotFoundPage, expectedText: 'Página no encontrada' },
  ];

  for (const pageCase of pageCases) {
    it(`should render ${pageCase.expectedText}`, async () => {
      await TestBed.configureTestingModule({
        imports: [pageCase.component],
        providers: [provideZonelessChangeDetection(), provideHttpClient(), provideRouter([])],
      }).compileComponents();

      const fixture = TestBed.createComponent(pageCase.component);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain(pageCase.expectedText);
    });
  }
});
