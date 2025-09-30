import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./login/login').then(m => m.Login) },
  {
    path: 'dashboard',
    canActivate: [() => import('./login/auth-guard').then(m => m.authGuard)],
    loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
    children: [
      { path: '', redirectTo: 'operaciones', pathMatch: 'full' },
      { path: 'operaciones', loadComponent: () => import('./operaciones/operaciones/operaciones').then(m => m.Operaciones) },
      { path: 'reportes', loadComponent: () => import('./reportes/reportes/reportes').then(m => m.Reportes) }
    ]
  }
];
