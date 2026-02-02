import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { R } from '@angular/cdk/keycodes';
@Component({
  selector: 'app-qoutation-form',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './qoutation-form.html',
})
export class QoutationForm implements OnInit {

  quotationId!: number;
  quotationData: any = null;
  loading = true;
  errorMsg = '';
includeCPU = true;
includeGPU = true;
includeAI = true;

  private PATCH_API =
    'http://127.0.0.1:8001/pricing-Model/Pricingcalculation/<int:pk>';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // 1️⃣ Get ID from URL
    this.quotationId = Number(this.route.snapshot.paramMap.get('id'));

    if (!this.quotationId) {
      this.errorMsg = 'Invalid quotation ID';
      this.loading = false;
      return;
    }

    // 2️⃣ Call API
    this.fetchQuotation();
  }
updateQuotation(
  includeCPU: boolean,
  includeGPU: boolean,
  includeAI: boolean
): void {

  const payload: any = {};

  // CPU
  if (!includeCPU) {
    payload.cpu = null;
    payload.cpu_cost = 0;
  }

  // GPU
  if (!includeGPU) {
    payload.gpu = null;
    payload.gpu_cost = 0;
  }

  // AI Features
  if (!includeAI) {
    payload.ai_features = [];
    payload.ai_cost = 0;
  }

  this.loading = true;

  this.http.patch<any>(
    `${this.PATCH_API}/${this.quotationId}/`,
    payload
  ).subscribe({
    next: (res) => {
      this.quotationData = res;
      this.loading = false;
    },
    error: (err) => {
      console.error(err);
      this.errorMsg = 'Failed to update quotation';
      this.loading = false;
    }
  });
}

  // ================= API CALL =================
  fetchQuotation(): void {
    this.loading = true;

    this.http.patch<any>(
      `${this.PATCH_API}/${this.quotationId}/`,
      {}
    ).subscribe({
      next: (res) => {
        // 3️⃣ Assign API response to template variable
        this.quotationData = res;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'Failed to generate quotation';
        this.loading = false;
      }
    });
  }
}
