import { routes } from './app.routes';

describe('routes', () => {
  it('should expose the base FCTNow frontend routes', () => {
    expect(routes.map((route) => route.path)).toEqual([
      '',
      'practicas',
      'practicas/:id',
      'mensajes',
      'notificaciones',
      'perfil',
      'login',
      'alumno',
      'alumno/solicitudes',
      'empresa',
      'empresa/ofertas',
      'empresa/ofertas/nueva',
      'empresa/ofertas/:id/editar',
      'tutor',
      'coordinador',
      'admin',
      '**',
    ]);
  });

  it('should keep every route lazy loaded through standalone components', () => {
    expect(routes.every((route) => typeof route.loadComponent === 'function')).toBeTrue();
  });
});
