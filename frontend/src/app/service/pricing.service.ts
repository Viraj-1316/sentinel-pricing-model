import { Injectable } from '@angular/core';          
import { HttpClient } from '@angular/common/http';  

@Injectable({ providedIn: 'root' })
export class PricingService {

  private baseUrl = 'http://127.0.0.1:8001/pricing-Model';

  constructor(private http: HttpClient) {}

  getAIFeatures() {
    return this.http.get<any[]>(`${this.baseUrl}/ai-feature/`);
  }

  calculatePricing(payload: any) {
    return this.http.post(`${this.baseUrl}/Pricingcalculation/`, payload);
  }

  getUserQuotations() {
    return this.http.get<any[]>(`${this.baseUrl}/user-quotations/`);
  }
}
