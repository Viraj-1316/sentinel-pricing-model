import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { HttpHeaders } from '@angular/common/http';
import { ToasterService } from '../service/toaster.service';
import { ConfirmdialogService } from '../service/confirmdialog.service';
import { RouterLink } from '@angular/router';
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

  // ✅ Total AI cost live (frontend)
  totalAiCost = 0;

  // ✅ Total cost returned by backend
  totalCost: number | null = null;

  // ✅ API endpoints
  private AI_API = 'http://127.0.0.1:8001/pricing-Model/ai-feature/';
  private QUOTE_API = 'http://127.0.0.1:8001/pricing-Model/Pricingcalculation/';
  private QUOTATION_API = 'http://127.0.0.1:8001/pricing-Model/user-quotations/';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private auth: AuthService,
    private confirm: ConfirmdialogService,
    private toaster: ToasterService,
    private router: Router
  ) {
    this.form = this.fb.group({
      cammera: ['', [Validators.required, Validators.min(1)]],
      ai_features: [[]], // ✅ selected feature ids
    });
  }

  ngOnInit(): void {
    this.fetchAIFeatures();

    // ✅ Update total AI cost when checkbox selection changes
    this.form.get('ai_features')?.valueChanges.subscribe((selectedIds: number[]) => {
      this.totalAiCost = this.calculateAiCost(selectedIds || []);
    });
  }
back(): void {
  this.router.navigateByUrl('/dashboard');
}

  // ✅ Logout
  async PromiseLogout() {
    const ok = await this.confirm.open(
      "Confirmation",
      "Are you sure you want to logout?"
    );
    if (ok){
      this.toaster.success("Logged out successfully");
   this.auth.logout();
    }
  }
  async onback() {
    const ok = await this.confirm.open(
      "Confirmation",
      "Want to see PriceList again?"
    );
    if (ok){
      this.toaster.success("PriceList opened successfully");
   this.back();
    }
  }

  // ✅ Validation helper
  isInvalid(controlName: string): boolean {
    const c = this.form.get(controlName);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  // ✅ Load AI features for dropdown list
  fetchAIFeatures(): void {
    this.http.get<AIEnabled[]>(this.AI_API).subscribe({
      next: (data) => {
        this.aiFeatures = data || [];

        // recalc total AI cost after data load
        const selected: number[] = this.form.value.ai_features || [];
        this.totalAiCost = this.calculateAiCost(selected);
      },
      error: () => {
        this.errorMsg = 'Failed to load AI features.';
      },
    });
  }

  // ✅ Checkbox toggle handler
  onToggleFeature(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current: number[] = this.form.value.ai_features || [];

    let updated: number[];

    if (checked) {
      updated = current.includes(id) ? current : [...current, id];
    } else {
      updated = current.filter((x) => x !== id);
    }

    this.form.patchValue({ ai_features: updated });
  }

  // ✅ Calculate AI total cost in frontend
  private calculateAiCost(selectedIds: number[]): number {
    return this.aiFeatures
      .filter((ai) => selectedIds.includes(ai.id))
      .reduce((sum, ai) => sum + Number(ai.costing || 0), 0);
  }

  // ✅ Calculate Cost (POST Pricingcalculation API)
  calculateCost(): void {
    this.errorMsg = null;
    this.totalCost = null;

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
        this.toaster.info("Cost calculated successfully");

        // ✅ show total cost below calculate cost
        this.totalCost = res?.total_costing ?? null;

        // ❌ don't render preview here
        // this.quotation = res;
      },
      error: (err) => {
        this.loading = false;

        // ✅ show useful message
        if (err?.error?.cammera) {
          this.errorMsg = err.error.cammera;
        } else {
          this.errorMsg = err?.error?.detail || 'Failed to calculate cost.';
        }
      },
    });
  }

  // ✅ Generate Quotation Preview (GET quotations API)
  generateQuotation(): void {
    this.errorMsg = null;

    if (this.totalCost === null) {
      this.errorMsg = 'Please calculate cost first.';
      return;
    }

    this.loading = true;

    this.http.get<any[]>(this.QUOTATION_API).subscribe({
      next: (res: any[]) => {
        this.loading = false;

        if (!res || res.length === 0) {
          this.errorMsg = 'No quotation found. Please calculate cost first.';
          this.quotation = null;
          return;
        }

        // ✅ backend returns latest first (order_by -created_at)
        const latest = res[0];

        this.quotation = latest;
        this.toaster.info("Quotation generated successfully");
        // ✅ update totalCost in UI also
        this.totalCost = latest?.total_costing ?? this.totalCost;
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.detail || 'Failed to load quotation preview.';
      },
    });
  }
  sendEmail(): void {
  if (!this.quotation?.id) return;

  this.http.post(
    `http://127.0.0.1:8001/pricing-Model/quotation/${this.quotation.id}/send-email/`,
    {}
  ).subscribe({
    next: () => alert("Email is sent ✅"),
    error: () => alert("Failed to send email ❌"),
  });
}


downloadPdf(): void {
  if (!this.quotation?.id) {
    this.errorMsg = 'Please generate quotation first.';
    return;
  }

  const url = `http://127.0.0.1:8001/pricing-Model/quotation/${this.quotation.id}/pdf/`;

  this.loading = true;

  this.http.get(url, { responseType: 'blob' }).subscribe({
    next: (blob) => {
      this.loading = false;

      // ✅ create pdf file
      const file = new Blob([blob], { type: 'application/pdf' });

      // ✅ download link
      const downloadURL = window.URL.createObjectURL(file);
      const a = document.createElement('a');

      a.href = downloadURL;
      a.download = `quotation_${this.quotation.id}.pdf`;
      a.click();
      this.toaster.success("PDF downloaded successfully");
      window.URL.revokeObjectURL(downloadURL);
    },
    error: () => {
      this.loading = false;
      this.errorMsg = 'Failed to download PDF.';
    },
  });
}
clearQuotation(): void {
  this.quotation = null;
  this.totalCost = null;
  this.errorMsg = null;
}



 
}
