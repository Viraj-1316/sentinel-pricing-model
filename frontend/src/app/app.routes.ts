import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // default route
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  // ✅ login
  {
    path: 'login',
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },

  // ✅ register
  {
    path: 'registration',
    loadComponent: () => import('./registration/registration').then((m) => m.Registration),
  },

  // ✅ dashboard (protected)
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [authGuard],
  },

  {
    path: 'user-requirements',
    loadComponent: () => import('./user-requirements/user-requirements').then((m) => m.UserRequirements),
    canActivate: [authGuard],
  },

  { path: '**', redirectTo: 'login' },
];
