import { Routes } from '@angular/router';
import { Login} from './login/login';
import {authGuard} from './guards/auth.guard'
import {Dashboard} from './dashboard/dashboard'
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  { path: 'login', component: Login },

  // ✅ placeholder dashboard route (create later)
  {
  path: 'dashboard',
  loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
  canActivate: [authGuard]
},


  // fallback
  { path: '**', redirectTo: 'login' },
];
