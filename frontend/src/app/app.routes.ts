import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { adminGuard } from './guards/admin.guard';
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  // Public
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./login/login').then(m => m.Login),
    data: { breadcrumb: { root: 'Auth', current: 'Login' } }
  },
  {
    path: 'registration',
    canActivate: [guestGuard],
    loadComponent: () => import('./registration/registration').then(m => m.Registration),
    data: { breadcrumb: { root: 'Auth', current: 'Registration' } }
  },
  {
    path: 'otp',
    canActivate: [guestGuard],
    loadComponent: () => import('./otp/otp').then(m => m.Otp),
    data: { breadcrumb: { root: 'Auth', current: 'OTP Verification' } }
  },

  // Protected layout
  {
    path: '',
    loadComponent: () => import('./app-layout/app-layout').then(m => m.AppLayout),
    canActivate: [authGuard],
    canActivateChild: [authGuard],

    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
        data: { breadcrumb: { root: 'Dashboard', current: 'Home' } }
      },

      {
        path: 'user-requirements',
        loadComponent: () =>
          import('./user-requirements/user-requirements').then(m => m.UserRequirements),
        data: { breadcrumb: { root: 'Dashboard', current: 'User Requirements' } }
      },

      {
        path: 'quotations',
        loadComponent: () => import('./quotations/quotations').then(m => m.Quotations),
        data: { breadcrumb: { root: 'Dashboard', current: 'Quotations' } }
      },
      {
        path: 'qoutation-form/:id',
        loadComponent: () => import('./qoutation-form/qoutation-form').then(m => m.QoutationForm),
        data: { breadcrumb: { root: 'Dashboard', current: 'Quotation Form' } }
      },

      {
        path: 'profile',
        loadComponent: () => import('./profile/profile').then(m => m.Profile),
        data: { breadcrumb: { root: 'Account', current: 'Profile' } }
      },

      {
        path: 'settings',
        loadComponent: () => import('./settings/settings').then(m => m.Settings),
        data: { breadcrumb: { root: 'Account', current: 'Settings' } }
      },

      // Admin
      {
  path: 'admin',
  canActivate: [adminGuard],
  children: [

    { path: '', pathMatch: 'full', redirectTo: 'pricelist' },  // ✅ IMPORTANT FIX

    {
      path: 'pricelist',
      loadComponent: () =>
        import('./pricelist/pricelist').then(m => m.Pricelist),
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
    }
  ]
},
    ],
  },

  { path: '**', redirectTo: 'login' },
];
