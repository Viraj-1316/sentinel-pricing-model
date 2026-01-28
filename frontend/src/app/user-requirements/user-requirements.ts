import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

export interface AIEnabled {
  id: number;
  AI_feature: string;
  costing: number;
}

/** ✅ Response from Pricingcalculation API */
export interface PricingCalculationResponse {
  camera_cost: number;
  storage_cost: number;
  ai_cost: number;
  total_costing: number;
}

function aiEnabledCameraValidator(group: AbstractControl): ValidationErrors | null {
  const total = Number(group.get('cammera')?.value || 0);
  const aiCam = Number(group.get('ai_enabled_cameras')?.value || 0);

  if (aiCam > total) return { aiCamMoreThanTotal: true };
  return null;
}

@Component({
  selector: 'app-user-requirements',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterLink, FormsModule],
  templateUrl: './user-requirements.html',
  styleUrl: './user-requirements.css',
})
export class UserRequirements implements OnInit {
  form: FormGroup;

  loading = false;
  errorMsg: string | null = null;

  // AI Features
  aiFeatures: AIEnabled[] = [];
  totalAiCost = 0;

  // cost summary
  costCalculated = false;
  totalCost: number | null = null;
  costBreakup: PricingCalculationResponse | null = null;

  /** ✅ APIs */
  private AI_API = 'http://127.0.0.1:8001/pricing-Model/ai-feature/';
  private QUOTE_API = 'http://127.0.0.1:8001/pricing-Model/Pricingcalculation/';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.form = this.fb.group(
      {
        cammera: [null, [Validators.required, Validators.min(1)]],
        storage_days: [30, [Validators.required, Validators.min(1)]],
        ai_enabled_cameras: [0, [Validators.required, Validators.min(0)]],
        ai_features: [[]],
      },
      { validators: aiEnabledCameraValidator }
    );
  }

  ngOnInit(): void {
    this.fetchAIFeatures();

    // ✅ AI selection changes -> update AI total
    this.form.get('ai_features')?.valueChanges.subscribe((ids: number[]) => {
      this.totalAiCost = this.calculateAiCost(ids || []);
    });

    // ✅ Reset results if user edits
    this.form.valueChanges.subscribe(() => {
      this.costCalculated = false;
      this.costBreakup = null;
      this.totalCost = null;
      this.errorMsg = null;
    });
  }

  // ==========================
  // ✅ NAV
  // ==========================
  onback() {
    this.router.navigateByUrl('/dashboard');
  }

  // ==========================
  // ✅ AI FEATURES
  // ==========================
  fetchAIFeatures(): void {
    this.http.get<AIEnabled[]>(this.AI_API).subscribe({
      next: (data) => {
        this.aiFeatures = data || [];
        const ids: number[] = this.form.value.ai_features || [];
        this.totalAiCost = this.calculateAiCost(ids);
      },
      error: () => {
        this.aiFeatures = [];
        this.errorMsg = 'Failed to load AI features.';
      },
    });
  }

  onToggleFeature(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current: number[] = this.form.value.ai_features || [];

    const updated = checked
      ? current.includes(id)
        ? current
        : [...current, id]
      : current.filter((x) => x !== id);

    this.form.patchValue({ ai_features: updated });
  }

  removeFeature(id: number): void {
    const current: number[] = this.form.value.ai_features || [];
    this.form.patchValue({ ai_features: current.filter((x) => x !== id) });
  }

  private calculateAiCost(selectedIds: number[]): number {
    return this.aiFeatures
      .filter((ai) => selectedIds.includes(ai.id))
      .reduce((sum, ai) => sum + Number(ai.costing || 0), 0);
  }

  get selectedFeatures(): AIEnabled[] {
    const ids: number[] = this.form.value.ai_features || [];
    return this.aiFeatures.filter((ai) => ids.includes(ai.id));
  }

  // ==========================
  // ✅ VALIDATION HELPERS
  // ==========================
  isInvalid(controlName: string): boolean {
    const c = this.form.get(controlName);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  get aiCamMoreThanTotal(): boolean {
    return !!(
      this.form.errors?.['aiCamMoreThanTotal'] &&
      (this.form.get('ai_enabled_cameras')?.touched ||
        this.form.get('ai_enabled_cameras')?.dirty)
    );
  }

  // ==========================
  // ✅ CALCULATE COST
  // ==========================
  calculateCost(): void {
    this.errorMsg = null;
    this.totalCost = null;
    this.costBreakup = null;
    this.costCalculated = false;

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      if (this.form.errors?.['aiCamMoreThanTotal']) {
        this.errorMsg = 'AI enabled cameras must be less than or equal to total cameras.';
        return;
      }

      this.errorMsg = 'Please fill all required fields correctly.';
      return;
    }

    const payload = {
      cammera: Number(this.form.value.cammera),
      storage_days: Number(this.form.value.storage_days),
      ai_features: this.form.value.ai_features || [],

      // ✅ include if your backend supports it
      ai_enabled_cameras: Number(this.form.value.ai_enabled_cameras || 0),
    };

    this.loading = true;

    this.http.post<PricingCalculationResponse>(this.QUOTE_API, payload).subscribe({
      next: (res) => {
        this.loading = false;

        this.costBreakup = {
          camera_cost: Number(res?.camera_cost || 0),
          storage_cost: Number(res?.storage_cost || 0),
          ai_cost: Number(res?.ai_cost || 0),
          total_costing: Number(res?.total_costing || 0),
        };

        this.totalCost = this.costBreakup.total_costing;
        this.costCalculated = true;
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.detail || 'Failed to calculate cost.';
      },
    });
  }

  // ==========================
  // ✅ CLEAR FORM
  // ==========================
  clearQuotation(): void {
    this.form.reset({
      cammera: null,
      storage_days: 30,
      ai_enabled_cameras: 0,
      ai_features: [],
    });

    this.totalAiCost = 0;
    this.costCalculated = false;
    this.costBreakup = null;
    this.totalCost = null;
    this.errorMsg = null;
  }
}
