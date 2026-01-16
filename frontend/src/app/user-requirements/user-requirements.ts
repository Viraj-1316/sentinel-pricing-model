import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AuthService } from '../service/auth.service';

/* ✅ Interface exactly matching backend response */
export interface AIEnabled {
  id: number;
  AI_feature: string;
  costing: number;
}

@Component({
  selector: 'app-user-requirements',
  standalone: true,
  templateUrl: './user-requirements.html',
  styleUrls: ['./user-requirements.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule
  ]
})
export class UserRequirements implements OnInit {

  form!: FormGroup;

  aiFeatures: AIEnabled[] = [];
  quotation: any = null;

  loading = false;
  errorMsg: string | null = null;

  totalAiCost = 0;
  totalCost: number | null = null;

  /* ✅ API endpoints */
  private AI_API = 'http://127.0.0.1:8001/pricing-Model/ai-feature/';
  private QUOTE_API = 'http://127.0.0.1:8001/pricing-Model/Pricingcalculation/';
  private QUOTATION_API = 'http://127.0.0.1:8001/pricing-Model/user-quotations/';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      camera: ['', [Validators.required, Validators.min(1)]],
      ai_features: [[]]
    });

    this.fetchAIFeatures();

    this.form.get('ai_features')?.valueChanges.subscribe((ids: number[]) => {
      this.totalAiCost = this.calculateAiCost(ids || []);
    });
  }

  /* =========================
     TEMPLATE REQUIRED METHODS
     ========================= */

  submit(): void {
    this.calculateCost();
  }

  onLogout(): void {
    this.logout();
  }

  clearQuotation(): void {
    this.quotation = null;
    this.totalCost = null;
    this.errorMsg = null;
  }

  logout(): void {
    this.auth.logout();
  }

  /* =========================
     DATA FETCHING
     ========================= */

  fetchAIFeatures(): void {
    this.http.get<AIEnabled[]>(this.AI_API).subscribe({
      next: (data: AIEnabled[]) => {
        this.aiFeatures = data;
      },
      error: () => {
        this.errorMsg = 'Failed to load AI features';
      }
    });
  }

  /* =========================
     CALCULATIONS
     ========================= */

  private calculateAiCost(ids: number[]): number {
    return this.aiFeatures
      .filter(ai => ids.includes(ai.id))
      .reduce((sum, ai) => sum + ai.costing, 0);
  }

  calculateCost(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMsg = null;

    this.http.post<any>(this.QUOTE_API, this.form.value).subscribe({
      next: (res) => {
        this.totalCost = res?.total_costing ?? null;
        this.loading = false;
      },
      error: (err: any) => {
        this.errorMsg = err?.error?.detail || 'Failed to calculate cost';
        this.loading = false;
      }
    });
  }

  /* =========================
     QUOTATION
     ========================= */

  generateQuotation(): void {
    this.loading = true;

    this.http.get<any[]>(this.QUOTATION_API).subscribe({
      next: (res) => {
        this.quotation = res?.[0] ?? null;
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Failed to load quotation';
        this.loading = false;
      }
    });
  }

  downloadPdf(): void {
    if (!this.quotation?.id) return;

    this.http.get(
      `http://127.0.0.1:8001/pricing-Model/quotation/${this.quotation.id}/pdf/`,
      { responseType: 'blob' }
    ).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quotation_${this.quotation.id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.errorMsg = 'Failed to download PDF';
      }
    });
  }
}
