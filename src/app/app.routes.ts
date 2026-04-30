import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'FCTNow',
    loadComponent: () => import('./home/home').then((m) => m.Home),
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
    path: 'empresa',
    title: 'Empresa | FCTNow',
    loadComponent: () => import('./empresas/empresa').then((m) => m.EmpresaPage),
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
