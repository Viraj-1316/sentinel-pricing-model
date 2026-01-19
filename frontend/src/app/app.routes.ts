import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // ✅ default
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  // ✅ public routes
  {
    path: 'login',
    loadComponent: () => import('./login/login').then(m => m.Login),
  },
  {
    path: 'registration',
    loadComponent: () => import('./registration/registration').then(m => m.Registration),
  },

  // ✅ protected routes inside layout
  {
    path: '',
    loadComponent: () => import('./app-layout/app-layout').then(m => m.AppLayout),
    canActivate: [authGuard],
    children: [

      // ✅ single dashboard route
      // inside dashboard component you will auto-switch UI (Admin/User)
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
      },

      // ✅ user requirement form
      {
        path: 'user-requirements',
        loadComponent: () =>
          import('./user-requirements/user-requirements').then(m => m.UserRequirements),
      },

      // ✅ quotations route (single for user+admin)
      {
        path: 'quotations',
        loadComponent: () =>
          import('./quotations/quotations').then(m => m.Quotations),
      },

      // ✅ Admin routes (you can hide from sidebar using isAdmin)
      // {
      //   path: 'camera-pricing',
      //   loadComponent: () =>
      //     import('./camera-pricing/camera-pricing').then(m => m.CameraPricing),
      // },
      // {
      //   path: 'ai-features',
      //   loadComponent: () =>
      //     import('./ai-features/ai-features').then(m => m.AiFeatures),
      // },
      // {
      //   path: 'users',
      //   loadComponent: () =>
      //     import('./users/users').then(m => m.Users),
      // },
      // {
      //   path: 'logs',
      //   loadComponent: () =>
      //     import('./logs/logs').then(m => m.Logs),
      // },

      // // ✅ profile (optional)
      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/profile').then(m => m.Profile),
      },

      // ✅ default inside layout
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },

  // ✅ fallback
  { path: '**', redirectTo: 'login' },
];
