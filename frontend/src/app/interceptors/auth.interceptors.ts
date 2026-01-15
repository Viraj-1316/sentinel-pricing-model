import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, switchMap, catchError } from 'rxjs';
import { AuthService } from '../service/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // ✅ don't attach token on auth endpoints
    if (req.url.includes('/api/token/')) {
      return next.handle(req);
    }

    const token =
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('access_token');

    let authReq = req;

    if (token) {
      authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }

    return next.handle(authReq).pipe(
      catchError((err: any) => {
        if (err instanceof HttpErrorResponse && err.status === 401) {
          // ✅ Access token expired → try refresh
          return this.auth.refreshToken().pipe(
            switchMap((res) => {
              const newAccess = res.access;

              // save refreshed access token
              this.auth.saveToken(newAccess, true);

              // retry original request with new token
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newAccess}` }
              });

              return next.handle(retryReq);
            }),
            catchError((refreshErr) => {
              // refresh also failed → logout
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
