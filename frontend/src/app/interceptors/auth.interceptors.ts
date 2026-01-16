import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';

import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../service/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private isRefreshing = false;

  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // ✅ Skip token endpoints to avoid infinite loop
    if (
      req.url.includes('/api/token/') ||
      req.url.includes('/api/token/refresh/')
    ) {
      return next.handle(req);
    }

    const token =
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('access_token');

    const authReq = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError((err: any) => {

        if (err instanceof HttpErrorResponse && err.status === 401 && !this.isRefreshing) {

          this.isRefreshing = true;

          return this.auth.refreshToken().pipe(
            switchMap((res: any) => {
              this.isRefreshing = false;

              const newAccess = res?.access; // ✅ adjust if your key name differs

              if (!newAccess) {
                this.auth.logout();
                return throwError(() => err);
              }

              // ✅ Save token
              this.auth.saveToken(newAccess);  // ✅ removed 2nd arg

              // ✅ Retry original request with new token
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newAccess}` }
              });

              return next.handle(retryReq);
            }),
            catchError((refreshErr) => {
              this.isRefreshing = false;
              this.auth.logout();
              return throwError(() => refreshErr);
            })
          );
        }

        return throwError(() => err);
      })
    );
  }
}
