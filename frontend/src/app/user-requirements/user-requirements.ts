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

  // ✅ Total AI cost (frontend live)
  totalAiCost = 0;

  // ✅ Total cost from backend
  totalCost: number | null = null;

  private AI_API = 'http://127.0.0.1:8001/pricing-Model/ai-feature/';
  private QUOTE_API = 'http://127.0.0.1:8001/pricing-Model/Pricingcalculation/';
  private QUOTATION_API = 'http://127.0.0.1:8001/pricing-Model/user-quotations/';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private auth: AuthService
  ) {
    this.form = this.fb.group({
      cammera: ['', [Validators.required, Validators.min(1)]],
      ai_features: [[]], // ✅ checkbox selected ids stored here
    });
  }

  ngOnInit(): void {
    this.fetchAIFeatures();

    // ✅ Live AI cost calculation when user selects checkboxes
    this.form.get('ai_features')?.valueChanges.subscribe((selectedIds: number[]) => {
      this.totalAiCost = this.calculateAiCost(selectedIds || []);
    });
  }

  // ============================================
  // ✅ LOGOUT
  // ============================================
  onLogout(): void {
    this.auth.logout();
  }

  // ============================================
  // ✅ VALIDATION HELPERS
  // ============================================
  isInvalid(controlName: string): boolean {
    const c = this.form.get(controlName);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  // ============================================
  // ✅ FETCH AI FEATURES FOR DROPDOWN
  // ============================================
  fetchAIFeatures(): void {
    this.http.get<AIEnabled[]>(this.AI_API).subscribe({
      next: (data) => {
        this.aiFeatures = data || [];

        // recalc total after load
        const selected = this.form.value.ai_features || [];
        this.totalAiCost = this.calculateAiCost(selected);
      },
      error: () => (this.errorMsg = 'Failed to load AI features.'),
    });
  }

  // ============================================
  // ✅ CHECKBOX MULTISELECT TOGGLE FUNCTION
  // ============================================
  onToggleFeature(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current: number[] = this.form.value.ai_features || [];

    let updated: number[];

    if (checked) {
      // add id if not already present
      updated = current.includes(id) ? current : [...current, id];
    } else {
      // remove id
      updated = current.filter(x => x !== id);
    }

    this.form.patchValue({ ai_features: updated });
  }

  // ============================================
  // ✅ CALCULATE AI COST (Frontend)
  // ============================================
  private calculateAiCost(selectedIds: number[]): number {
    return this.aiFeatures
      .filter(ai => selectedIds.includes(ai.id))
      .reduce((sum, ai) => sum + Number(ai.costing || 0), 0);
  }

  // ============================================
  // ✅ CALCULATE COST (POST Pricingcalculation)
  // ============================================
  calculateCost(): void {
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

        // ✅ only show total cost below calculate cost
        this.totalCost = res?.total_costing ?? null;

        // ❌ do not render quotation preview here
        // this.quotation = res;
      },
      error: (err) => {
        this.loading = false;
        this.totalCost = null;

        if (err?.error?.cammera) {
          this.errorMsg = err.error.cammera;
        } else {
          this.errorMsg = err?.error?.detail || 'Failed to calculate cost.';
        }
      },
    });
  }

  // ============================================
  // ✅ GENERATE QUOTATION PREVIEW (ONLY PERSONAL API)
  // ============================================
  generateQuotation(): void {
    this.errorMsg = null;

    // enforce calculate first
    if (this.totalCost === null) {
      this.errorMsg = 'Please calculate cost first.';
      return;
    }

    this.loading = true;

    // ✅ only personal API call allowed for preview
    this.http.get<any[]>(this.QUOTATION_API).subscribe({
      next: (res: any[]) => {
        this.loading = false;

        if (!res || res.length === 0) {
          this.errorMsg = 'No quotation found. Please calculate cost first.';
          this.quotation = null;
          return;
        }

        // ✅ latest quotation
        const latest = res[res.length - 1];

        this.quotation = latest;

        // update totalCost
        this.totalCost = latest?.total_costing ?? this.totalCost;
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.detail || 'Failed to load quotation preview.';
      },
    });
  }

  // ============================================
  // ✅ CLEAR PREVIEW
  // ============================================
  clearQuotation(): void {
    this.quotation = null;
    this.totalCost = null;
  }

  // ============================================
  // ✅ PDF DOWNLOAD PLACEHOLDER
  // ============================================
  downloadPdf(): void {
    alert('PDF download will be implemented from backend /quotation/{id}/pdf/');
  }
}
