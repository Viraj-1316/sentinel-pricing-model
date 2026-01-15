import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
export interface TokenResponse {
  access: string;
  refresh: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient, private router: Router) {}

  // ✅ Login
  login(payload: { username: string; password: string }): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.baseUrl}/accounts/api/token/`, payload);
  }

  // ✅ Refresh token
  refreshToken(): Observable<{ access: string }> {
    const refresh =
      localStorage.getItem('refresh_token') ||
      sessionStorage.getItem('refresh_token');

    return this.http.post<{ access: string }>(
      `${this.baseUrl}/accounts/api/token/refresh/`,
      { refresh }
    );
  }

  saveToken(token: string, remember = true) {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('access_token', token);
  }

  saveRefreshToken(token: string, remember = true) {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('refresh_token', token);
  }

  getToken(): string | null {
    return (
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('access_token')
    );
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
  }

  logout() {
    console.log("✅ Logout clicked one more time");
    this.clearTokens();
    this.router.navigateByUrl('/login');
  }
}
