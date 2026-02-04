import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface MeResponse {
  username: string;
  is_staff: boolean;
  is_superuser: boolean;
  email?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = `${environment.apiBaseUrl}`;

  // ✅ store user info globally
  private meSubject = new BehaviorSubject<MeResponse | null>(null);
  me$ = this.meSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // ✅ load cached me on refresh
    this.loadMeFromStorage();
  }

  // ✅ Login API
  login(payload: { username: string; password: string }): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${environment.apiBaseUrl}/accounts/api/token/`, payload);
  }

  // ✅ Refresh Token API
  refreshToken(): Observable<{ access: string }> {
    const refresh =
      localStorage.getItem('refresh_token') ||
      sessionStorage.getItem('refresh_token');

    return this.http.post<{ access: string }>(
      `${this.baseUrl}/accounts/api/token/refresh/`,
      { refresh }
    );
  }

  // ✅ Save tokens
  saveToken(token: string, remember = true) {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('access_token', token);
  }

  saveRefreshToken(token: string, remember = true) {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('refresh_token', token);
  }

  // ✅ Get Token
  getToken(): string | null {
    return (
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('access_token')
    );
  }

  // ✅ Logged in check
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // ✅ Me API (important)
  getMe(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.baseUrl}/accounts/api/me/`).pipe(
      tap((res) => {
        // ✅ save in subject + storage
        this.meSubject.next(res);
        localStorage.setItem('me', JSON.stringify(res));
      })
    );
  }

  // ✅ Load cached user role (after refresh)
  private loadMeFromStorage() {
    const raw = localStorage.getItem('me');
    if (raw) {
      const me = JSON.parse(raw);
      this.meSubject.next(me);
    }
  }

  // ✅ Admin check
  isAdmin(): boolean {
    const me = this.meSubject.value;
    return !!(me?.is_staff || me?.is_superuser);
  }

  // ✅ Clear tokens + user
  clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('me');

    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');

    this.meSubject.next(null);
  }

  // ✅ Logout
  logout() {
    this.clearTokens();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
