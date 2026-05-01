import { routes } from './app.routes';

describe('routes', () => {
  it('should expose the base FCTNow frontend routes', () => {
    expect(routes.map((route) => route.path)).toEqual([
      '',
      'login',
      'alumno',
      'empresa',
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
