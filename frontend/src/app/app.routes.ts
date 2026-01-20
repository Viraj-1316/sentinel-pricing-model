import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  // ✅ Default route
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  // ✅ Public routes (only for not-logged-in users)
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./login/login').then(m => m.Login),
  },
  {
<<<<<<< HEAD
    path: 'registration',
=======
    path: 'register',
>>>>>>> sujit-feature
    canActivate: [guestGuard],
    loadComponent: () => import('./registration/registration').then(m => m.Registration),
  },

  // ✅ Protected routes (all inside app layout)
  {
    path: '',
    loadComponent: () => import('./app-layout/app-layout').then(m => m.AppLayout),
    canActivate: [authGuard],
    canActivateChild: [authGuard],

    children: [
      // ✅ Default inside layout
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

      // ✅ Dashboard (single)
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
      },

      // ✅ User Requirements
      {
        path: 'user-requirements',
        loadComponent: () =>
          import('./user-requirements/user-requirements').then(m => m.UserRequirements),
      },

      // ✅ Quotations
      {
        path: 'quotations',
        loadComponent: () => import('./quotations/quotations').then(m => m.Quotations),
      },

      // ✅ Profile
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile').then(m => m.Profile),
      },

      // ✅ Settings (enterprise)
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings').then(m => m.Settings),
      },

      // ✅ Admin pages (protected)
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          {
            path: 'pricelist',
            loadComponent: () =>
<<<<<<< HEAD
              import('./pricelist/pricelist').then(m => m.Pricelist),
=======
              import('./pricelist/pricelist').then(m => m.PriceList),
>>>>>>> sujit-feature
          },

          {
            path: 'user-management',
            loadComponent: () =>
              import('./user-management/user-management').then(m => m.UserManagement),
          },

          {
            path: 'logs',
            loadComponent: () =>
              import('./logs/logs').then(m => m.Logs),
          },

          // ✅ admin default
          // { path: '', pathMatch: 'full', redirectTo: 'camera-pricing' },
        ],
      },

    ],
  },

  // ✅ fallback
  { path: '**', redirectTo: 'login' },
];
