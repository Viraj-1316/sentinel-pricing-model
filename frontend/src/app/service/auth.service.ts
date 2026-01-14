import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';

export interface TokenResponse {
  access: string;
  refresh: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // ✅ Login (JWT token obtain)
  login(payload: { username: string; password: string }): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(
      `${this.baseUrl}/accounts/api/token/`,
      payload
    );
  }

  saveToken(token: string) {
    localStorage.setItem('access_token', token);
  }

  saveRefreshToken(token: string) {
    localStorage.setItem('refresh_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}
