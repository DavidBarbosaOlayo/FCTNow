import { provideZonelessChangeDetection, Type } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminPage } from './admin/admin';
import { AlumnoPage } from './alumnos/alumno';
import { LoginPage } from './auth/login';
import { EmpresaPage } from './empresas/empresa';
import { CoordinadorPage } from './fct/coordinador';
import { MensajesPage } from './mensajes/mensajes';
import { NotificacionesPage } from './notificaciones/notificaciones';
import { NotFoundPage } from './not-found/not-found';
import { PerfilPage } from './perfil/perfil';
import { PracticasPage } from './practicas/practicas';

type RoutePageCase = {
  component: Type<unknown>;
};

describe('route placeholder pages', () => {
  const pageCases: RoutePageCase[] = [
    { component: LoginPage },
    { component: PracticasPage },
    { component: MensajesPage },
    { component: NotificacionesPage },
    { component: PerfilPage },
    { component: AlumnoPage },
    { component: EmpresaPage },
    { component: CoordinadorPage },
    { component: AdminPage },
    { component: NotFoundPage },
  ];

  for (const pageCase of pageCases) {
    it(`should render ${pageCase.component.name} without a route hero header`, async () => {
      await TestBed.configureTestingModule({
        imports: [pageCase.component],
        providers: [
          provideZonelessChangeDetection(),
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(pageCase.component);
      fixture.detectChanges();
      const httpTesting = TestBed.inject(HttpTestingController);
      for (const request of httpTesting.match('/api/ofertas')) {
        request.flush([]);
      }
      for (const request of httpTesting.match((candidate) =>
        candidate.url === '/api/ofertas/externas',
      )) {
        request.flush({
          results: [],
          page: 1,
          resultsPerPage: 20,
          totalResults: 0,
          attribution: 'Resultados ofrecidos por Adzuna',
          attributionUrl: 'https://www.adzuna.es/',
        });
      }
      for (const request of httpTesting.match('/api/alumno/solicitudes-externas')) {
        request.flush([]);
      }
      fixture.detectChanges();
      httpTesting.verify();
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('main.route-page')).not.toBeNull();
      expect(compiled.querySelector('.route-hero')).toBeNull();
    });
  }
});
