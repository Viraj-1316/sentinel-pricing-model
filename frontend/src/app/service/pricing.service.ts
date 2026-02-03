import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PricingService {

  private baseUrl = 'http://127.0.0.1:8001/pricing-Model';

  constructor(private http: HttpClient) {}

  /** PATCH pricing calculation */
  patchPricingCalculation(id: number): Observable<any> {
    return this.http.patch(
      `${this.baseUrl}/Pricingcalculation/${id}/`,
      {} // backend recalculates, so empty body
    );
  }
}
