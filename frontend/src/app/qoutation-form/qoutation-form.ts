import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
 
@Component({
  selector: 'app-qoutation-form',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './qoutation-form.html',
})
export class QoutationForm implements OnInit {
 
  quotationId!: number;
  quotationData: any = null;
  loading = false;
  errorMsg = '';
 
  // Toggles
  includeCPU = true;
  includeGPU = true;
  includeAI = true;
  includeStorage = true;
 
  private API =
    'http://127.0.0.1:8001/pricing-Model/Pricingcalculation';
 
  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}
 
  ngOnInit(): void {
    this.quotationId = Number(this.route.snapshot.paramMap.get('id'));
 
    if (!this.quotationId) {
      this.errorMsg = 'Invalid quotation ID';
      return;
    }
 
    this.fetchQuotation();
  }
 
  // ================= FETCH =================
  fetchQuotation(): void {
    this.loading = true;
 
    this.http.get<any>(`${this.API}/${this.quotationId}/`)
      .subscribe({
        next: (res) => {
          this.quotationData = res;
 
          // Sync toggles
          this.includeCPU = res.include_cpu;
          this.includeGPU = res.include_gpu;
          this.includeAI = res.include_ai;
          this.includeStorage = res.include_storage;
 
          this.loading = false;
        },
        error: () => {
          this.errorMsg = 'Failed to fetch quotation';
          this.loading = false;
        }
      });
  }
 
  // ================= UPDATE =================
  updateQuotation(): void {
    const payload = {
      include_cpu: this.includeCPU,
      include_gpu: this.includeGPU,
      include_ai: this.includeAI,
      include_storage: this.includeStorage
    };
 
    this.loading = true;
 
    this.http.patch<any>(
      `${this.API}/${this.quotationId}/`,
      payload
    ).subscribe({
      next: (res) => {
        this.quotationData = res;
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Failed to update quotation';
        this.loading = false;
      }
    });
  }
}
 