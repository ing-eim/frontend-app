import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' }, 
  { path: 'login', loadComponent: () => import('./login/login').then(m => m.Login) },
  {
    path: 'dashboard',
   // canActivate: [() => import('./login/auth-guard').then(m => m.authGuard)], //comentar para pruebas
    loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
    children: [
      { path: '', redirectTo: 'operaciones', pathMatch: 'full' },
  { path: 'inicio', loadComponent: () => import('./dashboard/inicio/inicio').then(m => m.Inicio) },
      { path: 'operaciones', loadComponent: () => import('./operaciones/operaciones/operaciones').then(m => m.Operaciones) },
      { path: 'operaciones/carga-archivos', loadComponent: () => import('./operaciones/operaciones/operaciones').then(m => m.Operaciones) },
  { path: 'operaciones/sincronizacion', loadComponent: () => import('./operaciones/sincronizacion/sincronizacion').then(m => m.Sincronizacion) },
      { path: 'reportes', loadComponent: () => import('./reportes/reportes/reportes').then(m => m.Reportes) },
      { path: 'usuarios', loadComponent: () => import('./usuarios/usuarios').then(m => m.Usuarios) },
      { path: 'roles', loadComponent: () => import('./roles/roles').then(m => m.Roles) },
      { path: 'bitacora', loadComponent: () => import('./bitacora/bitacora').then(m => m.Bitacora) }
    ]
  }
];
