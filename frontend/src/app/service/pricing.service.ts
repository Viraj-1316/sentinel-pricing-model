import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class PricingService {

  private baseUrl = `${environment.apiBaseUrl}/pricing-Model`;

  constructor(private http: HttpClient) {}

  /** PATCH pricing calculation */
  patchPricingCalculation(id: number): Observable<any> {
    return this.http.patch(
      `${this.baseUrl}/Pricingcalculation/${id}/`,
      {} // backend recalculates, so empty body
    );
  }
}
