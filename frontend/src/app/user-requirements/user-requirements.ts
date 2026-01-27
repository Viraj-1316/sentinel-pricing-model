import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { ToasterService } from '../service/toaster.service';
import { ConfirmdialogService } from '../service/confirmdialog.service';
import { RouterLink } from '@angular/router';
import { RouterModule } from '@angular/router';
export interface AIEnabled {
  id: number;
  AI_feature: string;
  costing: number;
}

export interface CameraPricingSlab {
  id: number;
  min_cammera: number;
  max_cammera: number | null;
  total_costing: number;
}

type RightTab = 'camera' | 'ai' | 'preview';

@Component({
  selector: 'app-user-requirements',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterLink,RouterModule],
  templateUrl: './user-requirements.html',
})
export class UserRequirements implements OnInit {
  form: FormGroup;

  loading = false;
  errorMsg: string | null = null;

  aiFeatures: AIEnabled[] = [];
  cameraPricing: CameraPricingSlab[] = [];

  quotation: any = null;

  // ✅ live frontend totals
  totalAiCost = 0;
  totalCost: number | null = null;

  // ✅ enterprise flow flags
  costCalculated = false;
  quotationGenerated = false;

  // ✅ right panel tab
  activeTab: RightTab = 'camera';

  // ✅ show selected slab for camera pricing table highlight
  selectedCameraSlab: CameraPricingSlab | null = null;

  // ✅ API endpoints
  private CAMERA_PRICING_API = 'http://127.0.0.1:8001/pricing-Model/cameraPricing/';
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
      ai_features: [[]],
    });
  }

  ngOnInit(): void {
    this.fetchCameraPricing();
    this.fetchAIFeatures();

    // ✅ when AI checkbox changes -> update AI total + switch tab
    this.form.get('ai_features')?.valueChanges.subscribe((selectedIds: number[]) => {
      this.totalAiCost = this.calculateAiCost(selectedIds || []);
      // enterprise: if user selects features, show AI tab
      if ((selectedIds || []).length > 0 && !this.quotationGenerated) {
        this.activeTab = 'ai';
      }
    });

    // ✅ when camera count changes -> show camera tab + highlight slab
    this.form.get('cammera')?.valueChanges.subscribe((value: any) => {
      const cam = Number(value || 0);
      this.selectedCameraSlab = this.findMatchingSlab(cam);
      if (!this.quotationGenerated) {
        this.activeTab = 'camera';
      }
    });

    // ✅ if user changes anything after calculating -> reset flow
    this.form.valueChanges.subscribe(() => {
      this.costCalculated = false;
      this.quotationGenerated = false;
      this.quotation = null;
      this.totalCost = null;
      this.errorMsg = null;
    });
  }

  // ==========================
  // ✅ UI helpers
  // ==========================
  setTab(tab: RightTab) {
    this.activeTab = tab;
  }

  isInvalid(controlName: string): boolean {
    const c = this.form.get(controlName);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  // ==========================
  // ✅ Navigation
  // ==========================
  back(): void {
    this.router.navigateByUrl('/dashboard');
  }

  async PromiseLogout() {
    const ok = await this.confirm.open('Confirmation', 'Are you sure you want to logout?');
    if (ok) {
      this.toaster.success('Logged out successfully');
      this.auth.logout();
    }
  }

  async onback() {
    const ok = await this.confirm.open('Confirmation', 'Want to go back to Dashboard?');
    if (ok) {
      this.back();
    }
  }

  // ==========================
  // ✅ Fetch Camera Pricing slabs
  // ==========================
  fetchCameraPricing(): void {
    this.http.get<CameraPricingSlab[]>(this.CAMERA_PRICING_API).subscribe({
      next: (data) => {
        this.cameraPricing = data || [];
        const cam = Number(this.form.value.cammera || 0);
        this.selectedCameraSlab = this.findMatchingSlab(cam);
      },
      error: () => {
        // not blocking flow, just inform
        console.log('❌ Failed to load camera pricing');
      },
    });
  }

  private findMatchingSlab(cameras: number): CameraPricingSlab | null {
    if (!cameras || this.cameraPricing.length === 0) return null;

    // match min <= cameras and (max >= cameras OR max null)
    const slab =
      this.cameraPricing
        .filter(s => Number(s.min_cammera) <= cameras)
        .filter(s => s.max_cammera === null || Number(s.max_cammera) >= cameras)
        .sort((a, b) => Number(a.min_cammera) - Number(b.min_cammera))[0] || null;

    // if none found, pick highest slab (fallback enterprise)
    return slab ?? this.cameraPricing.sort((a, b) => Number(b.min_cammera) - Number(a.min_cammera))[0] ?? null;
  }

  // ==========================
  // ✅ Fetch AI Features
  // ==========================
  fetchAIFeatures(): void {
    this.http.get<AIEnabled[]>(this.AI_API).subscribe({
      next: (data) => {
        this.aiFeatures = data || [];
        const selected: number[] = this.form.value.ai_features || [];
        this.totalAiCost = this.calculateAiCost(selected);
      },
      error: () => (this.errorMsg = 'Failed to load AI features.'),
    });
  }

  onToggleFeature(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current: number[] = this.form.value.ai_features || [];

    let updated: number[];
    if (checked) updated = current.includes(id) ? current : [...current, id];
    else updated = current.filter(x => x !== id);

    this.form.patchValue({ ai_features: updated });
  }

  private calculateAiCost(selectedIds: number[]): number {
    return this.aiFeatures
      .filter(ai => selectedIds.includes(ai.id))
      .reduce((sum, ai) => sum + Number(ai.costing || 0), 0);
  }

  get selectedFeatures(): AIEnabled[] {
  const ids: number[] = this.form.value.ai_features || [];
  return this.aiFeatures.filter(ai => ids.includes(ai.id));
}


  // ==========================
  // ✅ Step 1: Calculate Cost
  // ==========================
  calculateCost(): void {
    this.errorMsg = null;
    this.totalCost = null;

    // reset next step
    this.costCalculated = false;
    this.quotationGenerated = false;
    this.quotation = null;

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

        this.totalCost = res?.total_costing ?? null;
        this.costCalculated = true;

        this.toaster.success('Cost calculated successfully ✅');
        // enterprise: after cost calculation, show camera tab (pricing justification)
        this.activeTab = 'camera';
      },
      error: (err) => {
        this.loading = false;
        if (err?.error?.cammera) this.errorMsg = err.error.cammera;
        else this.errorMsg = err?.error?.detail || 'Failed to calculate cost.';
      },
    });
  }

  // ==========================
  // ✅ Step 2: Generate Quotation -> auto open Preview tab
  // ==========================
  generateQuotation(): void {
    this.errorMsg = null;

    if (!this.costCalculated || this.totalCost === null) {
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

        const latest = res[0];
        this.quotation = latest;
        this.totalCost = latest?.total_costing ?? this.totalCost;

        this.quotationGenerated = true;

        // ✅ AUTO SWITCH to preview tab (enterprise behavior)
        this.activeTab = 'preview';

        this.toaster.success('Quotation generated ✅');
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.detail || 'Failed to load quotation preview.';
      },
    });
  }
removeFeature(id: number): void {
  const current: number[] = this.form.value.ai_features || [];
  const updated = current.filter(x => x !== id);
  this.form.patchValue({ ai_features: updated });
}

  // ==========================
  // ✅ Email
  // ==========================
  sendEmail(): void {
    if (!this.quotation?.id) {
      this.toaster.error('Generate quotation first');
      return;
    }

    this.loading = true;

    this.http
      .post(
        `http://127.0.0.1:8001/pricing-Model/quotation/${this.quotation.id}/send-email/`,
        {}
      )
      .subscribe({
        next: () => {
          this.loading = false;
          this.toaster.success('Email queued/sent ✅');
        },
        error: () => {
          this.loading = false;
          this.toaster.error('Email failed ❌');
        },
      });
  }

  // ==========================
  // ✅ Download PDF
  // ==========================
  downloadPdf(): void {
  if (!this.quotation?.id) {
    this.errorMsg = 'Please generate quotation first.';
    return;
  }

  const url = `http://127.0.0.1:8001/pricing-Model/quotation/${this.quotation.id}/pdf/`;
  const token = localStorage.getItem('access_token');

  this.loading = true;
  this.errorMsg = null;

  this.http.get(url, {
    responseType: 'blob',
    headers: {
      Authorization: `Bearer ${token}`
    }
  }).subscribe({
    next: (blob) => {
      this.loading = false;

      const file = new Blob([blob], { type: 'application/pdf' });
      const downloadURL = window.URL.createObjectURL(file);

      const a = document.createElement('a');
      a.href = downloadURL;
      a.download = `quotation_${this.quotation.id}.pdf`;
      a.click();

      window.URL.revokeObjectURL(downloadURL);
      this.toaster.success('PDF downloaded ✅');
    },
    error: (err) => {
      this.loading = false;
      console.log("PDF Download Error:", err);
      this.errorMsg = err?.error?.detail || 'Failed to download PDF.';
    },
  });
}

  // ==========================
  // ✅ Clear
  // ==========================
  clearQuotation(): void {
    this.quotation = null;
    this.totalCost = null;
    this.errorMsg = null;

    this.costCalculated = false;
    this.quotationGenerated = false;

    this.activeTab = 'camera';
    this.toaster.info('Cleared ✅');
  }
}
