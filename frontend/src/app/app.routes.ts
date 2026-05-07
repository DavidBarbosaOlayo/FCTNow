import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'FCTNow',
    loadComponent: () => import('./home/home').then((m) => m.Home),
  },
  {
    path: 'practicas',
    title: 'Prácticas | FCTNow',
    loadComponent: () => import('./practicas/practicas').then((m) => m.PracticasPage),
  },
  {
    path: 'practicas/:id',
    title: 'Detalle de práctica | FCTNow',
    loadComponent: () => import('./practicas/oferta-detail').then((m) => m.OfertaDetailPage),
  },
  {
    path: 'mensajes',
    title: 'Mensajes | FCTNow',
    loadComponent: () => import('./mensajes/mensajes').then((m) => m.MensajesPage),
  },
  {
    path: 'notificaciones',
    title: 'Notificaciones | FCTNow',
    loadComponent: () =>
      import('./notificaciones/notificaciones').then((m) => m.NotificacionesPage),
  },
  {
    path: 'perfil',
    title: 'Perfil | FCTNow',
    loadComponent: () => import('./perfil/perfil').then((m) => m.PerfilPage),
  },
  {
    path: 'login',
    title: 'Acceso | FCTNow',
    loadComponent: () => import('./auth/login').then((m) => m.LoginPage),
  },
  {
    path: 'alumno',
    title: 'Alumno | FCTNow',
    loadComponent: () => import('./alumnos/alumno').then((m) => m.AlumnoPage),
  },
  {
    path: 'alumno/solicitudes',
    title: 'Mis solicitudes | FCTNow',
    loadComponent: () =>
      import('./alumnos/mis-solicitudes').then((m) => m.MisSolicitudesPage),
  },
  {
    path: 'alumno/preferencias',
    title: 'Preferencias | FCTNow',
    loadComponent: () =>
      import('./alumnos/preferencias').then((m) => m.PreferenciasAlumnoPage),
  },
  {
    path: 'empresa',
    title: 'Empresa | FCTNow',
    loadComponent: () => import('./empresas/empresa').then((m) => m.EmpresaPage),
  },
  {
    path: 'empresa/ofertas',
    title: 'Mis ofertas | FCTNow',
    loadComponent: () =>
      import('./empresas/mis-ofertas-empresa').then((m) => m.MisOfertasEmpresaPage),
  },
  {
    path: 'empresa/ofertas/nueva',
    title: 'Nueva oferta | FCTNow',
    loadComponent: () =>
      import('./empresas/oferta-empresa-form').then((m) => m.OfertaEmpresaFormPage),
  },
  {
    path: 'empresa/ofertas/:id/editar',
    title: 'Editar oferta | FCTNow',
    loadComponent: () =>
      import('./empresas/oferta-empresa-form').then((m) => m.OfertaEmpresaFormPage),
  },
  {
    path: 'tutor',
    title: 'Tutor centro | FCTNow',
    loadComponent: () => import('./fct/tutor').then((m) => m.TutorPage),
  },
  {
    path: 'coordinador',
    title: 'Coordinador | FCTNow',
    loadComponent: () => import('./fct/coordinador').then((m) => m.CoordinadorPage),
  },
  {
    path: 'admin',
    title: 'Administración | FCTNow',
    loadComponent: () => import('./admin/admin').then((m) => m.AdminPage),
  },
  {
    path: '**',
    title: 'Página no encontrada | FCTNow',
    loadComponent: () => import('./not-found/not-found').then((m) => m.NotFoundPage),
  },
];
