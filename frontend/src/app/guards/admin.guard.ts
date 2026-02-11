import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { map, catchError, of } from 'rxjs';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);

  return auth.getMe().pipe(
    map((res: any) => {

      // ✅ CORRECT LOGIC
      const isAdmin = res?.role?.toLowerCase() === 'admin';

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
