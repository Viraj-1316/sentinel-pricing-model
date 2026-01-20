import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { map, catchError, of } from 'rxjs';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);

  // ✅ check role from backend (recommended)
  return auth.getMe().pipe(
    map((res: any) => {
      const isAdmin = !!(res?.is_staff || res?.is_superuser);

      if (isAdmin) return true;

      router.navigateByUrl('/dashboard', { replaceUrl: true });
      return false;
    }),
    catchError((err) => {
             console.log("ME ERROR:", err);
      router.navigateByUrl('/login', { replaceUrl: true });
      return of(false);
    })
  );
};
