import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../service/auth.service';

export interface AIEnabled {
  id: number;
  AI_feature: string;
  costing: number;
}

@Component({
  selector: 'app-user-requirements',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterLink],
  templateUrl: './user-requirements.html',
})
export class UserRequirements implements OnInit {
  form: FormGroup;
  loading = false;
  errorMsg: string | null = null;

  aiFeatures: AIEnabled[] = [];
  quotation: any = null;

  // ✅ NEW: Total AI cost (below dropdown)
  totalAiCost = 0;

  private AI_API = 'http://127.0.0.1:8001/pricing-Model/ai-feature/';
  private QUOTE_API = 'http://127.0.0.1:8001/pricing-Model/Pricingcalculation/';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private auth: AuthService
  ) {
    this.form = this.fb.group({
      cammera: ['', [Validators.required, Validators.min(1)]],
      ai_features: [[]], // multiple selected ids
    });
  }

  ngOnInit(): void {
    this.fetchAIFeatures();

    // ✅ Calculate total cost live when user selects features
    this.form.get('ai_features')?.valueChanges.subscribe((selectedIds: number[]) => {
      this.totalAiCost = this.calculateAiCost(selectedIds || []);
    });
  }

  onLogout(): void {
    this.auth.logout();
  }

  isInvalid(controlName: string): boolean {
    const c = this.form.get(controlName);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  fetchAIFeatures(): void {
    this.http.get<AIEnabled[]>(this.AI_API).subscribe({
      next: (data) => {
        this.aiFeatures = data || [];

        // ✅ when AI features load, recalc total based on already selected values
        const selected = this.form.value.ai_features || [];
        this.totalAiCost = this.calculateAiCost(selected);
      },
      error: () => (this.errorMsg = 'Failed to load AI features.'),
    });
  }

  // ✅ helper function
  private calculateAiCost(selectedIds: number[]): number {
    return this.aiFeatures
      .filter(ai => selectedIds.includes(ai.id))
      .reduce((sum, ai) => sum + Number(ai.costing || 0), 0);
  }

  submit(): void {
    this.errorMsg = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      cammera: Number(this.form.value.cammera),
      ai_features: this.form.value.ai_features || [],
    };

    this.loading = true;
    this.http.post(this.QUOTE_API, payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.quotation = res;
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.detail || 'Failed to generate quotation.';
      },
    });
  }

  clearQuotation(): void {
    this.quotation = null;

    // ✅ optional: also reset form + cost
    this.form.reset({ cammera: '', ai_features: [] });
    this.totalAiCost = 0;
  }

  downloadPdf(): void {
    alert('PDF download will be implemented from backend /quotation/{id}/pdf/');
  }
}
