import { Routes } from '@angular/router';
import { Login} from './login/login';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  { path: 'login', component: Login },

  // ✅ placeholder dashboard route (create later)
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard').then(m => m.Dashboard),
  },

  // fallback
  { path: '**', redirectTo: 'login' },
];
