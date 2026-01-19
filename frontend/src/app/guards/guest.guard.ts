import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const guestGuard: CanActivateFn = () => {
  const router = inject(Router);

  const token =
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token');

  // ✅ if NOT logged in -> allow login/register
  if (!token) return true;

  // ✅ if already logged in -> redirect dashboard
  router.navigateByUrl('/dashboard', { replaceUrl: true });
  return false;
};
