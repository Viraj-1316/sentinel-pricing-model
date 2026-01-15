import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PricingService {

  private baseUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  getAIFeatures() {
    return this.http.get<any[]>(`${this.baseUrl}/ai-features/`);
  }

  calculatePricing(payload: any) {
    return this.http.post(`${this.baseUrl}/calculate-pricing/`, payload);
  }

  getUserQuotations() {
    return this.http.get<any[]>(`${this.baseUrl}/user-quotations/`);
  }
}
