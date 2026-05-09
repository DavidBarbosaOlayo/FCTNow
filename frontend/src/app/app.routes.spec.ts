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
      'alumno/preferencias',
      'empresa',
      'empresa/ofertas',
      'empresa/perfil',
      'empresa/solicitudes',
      'empresa/ofertas/nueva',
      'empresa/ofertas/:id/editar',
      'asignaciones',
      'tutor',
      'coordinador',
      'admin',
      '**',
    ]);
  });

  it('should keep every non-redirect route lazy loaded through standalone components', () => {
    const componentRoutes = routes.filter((route) => !route.redirectTo);
    expect(componentRoutes.every((route) => typeof route.loadComponent === 'function')).toBeTrue();
  });

  it('should redirect the legacy preferencias and empresa-perfil routes to /perfil', () => {
    const preferencias = routes.find((route) => route.path === 'alumno/preferencias');
    const empresaPerfil = routes.find((route) => route.path === 'empresa/perfil');

    expect(preferencias?.redirectTo).toBe('/perfil');
    expect(preferencias?.pathMatch).toBe('full');
    expect(empresaPerfil?.redirectTo).toBe('/perfil');
    expect(empresaPerfil?.pathMatch).toBe('full');
  });
});
