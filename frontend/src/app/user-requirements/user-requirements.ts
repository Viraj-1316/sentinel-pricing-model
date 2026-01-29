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

/* =========================
   INTERFACES
========================= */

export interface AIEnabled {
  id: number;
  AI_feature: string;
  costing: number;
}

export interface RequirementCalculationResponse {
  id?: number;
  cammera: number;
  storage_days: number;
  aiEnabledCam: number;
  ai_features: number[];
  storage_used_user: number;
  vram_required: number;
  cpuCores_required: number;
  ram_required: number;
  created_at?: string;
}

/* =========================
   VALIDATOR
========================= */

function aiEnabledCameraValidator(
  group: AbstractControl
): ValidationErrors | null {
  const total = Number(group.get('cammera')?.value || 0);
  const aiCam = Number(group.get('aiEnabledCam')?.value || 0);

  if (aiCam > total) {
    return { aiCamMoreThanTotal: true };
  }
  return null;
}

/* =========================
   COMPONENT
========================= */

@Component({
  selector: 'app-user-requirements',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterLink,
    FormsModule,
  ],
  templateUrl: './user-requirements.html',
  styleUrl: './user-requirements.css',
})
export class UserRequirements implements OnInit {
  form: FormGroup;

  loading = false;
  errorMsg: string | null = null;

  aiFeatures: AIEnabled[] = [];

  costCalculated = false;
  requirements: RequirementCalculationResponse | null = null;

  private AI_API =
    'http://127.0.0.1:8001/pricing-Model/ai-feature/';
  private QUOTE_API =
    'http://127.0.0.1:8001/pricing-Model/Pricingcalculation/';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.form = this.fb.group(
      {
        cammera: [null, [Validators.required, Validators.min(1)]],
        storage_days: [30, [Validators.required, Validators.min(1)]],
        aiEnabledCam: [0, [Validators.required, Validators.min(0)]],
        ai_features: [[]],
      },
      { validators: aiEnabledCameraValidator }
    );
  }

  /* =========================
     INIT
  ========================= */

  ngOnInit(): void {
    this.fetchAIFeatures();

    this.form.valueChanges.subscribe(() => {
      this.costCalculated = false;
      this.requirements = null;
      this.errorMsg = null;
    });
  }

  /* =========================
     NAVIGATION
  ========================= */

  onback(): void {
    this.router.navigateByUrl('/dashboard');
  }

  /* =========================
     AI FEATURES
  ========================= */

  fetchAIFeatures(): void {
    this.http.get<AIEnabled[]>(this.AI_API).subscribe({
      next: (res) => (this.aiFeatures = res || []),
      error: () => {
        this.aiFeatures = [];
        this.errorMsg = 'Failed to load AI features';
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
    this.form.patchValue({
      ai_features: current.filter((x) => x !== id),
    });
  }

  get selectedFeatures(): AIEnabled[] {
    const ids: number[] = this.form.value.ai_features || [];
    return this.aiFeatures.filter((x) => ids.includes(x.id));
  }

  /* =========================
     VALIDATION HELPERS
  ========================= */

  get aiCamMoreThanTotal(): boolean {
    return !!(
      this.form.errors?.['aiCamMoreThanTotal'] &&
      (this.form.get('aiEnabledCam')?.touched ||
        this.form.get('aiEnabledCam')?.dirty)
    );
  }

  /* =========================
     MAIN CALCULATION
  ========================= */

  calculateCost(): void {
    this.errorMsg = null;
    this.costCalculated = false;
    this.requirements = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMsg =
        'Please fill all required fields correctly.';
      return;
    }

    const payload = {
      cammera: Number(this.form.value.cammera),
      storage_days: Number(this.form.value.storage_days),
      aiEnabledCam: Number(this.form.value.aiEnabledCam),
      ai_features: this.form.value.ai_features || [],
    };

    this.loading = true;

    this.http
      .post<RequirementCalculationResponse>(
        this.QUOTE_API,
        payload
      )
      .subscribe({
        next: (res) => {
          this.loading = false;

          this.requirements = {
            id: res?.id,
            cammera: res?.cammera ?? payload.cammera,
            storage_days: payload.storage_days,
            aiEnabledCam: res?.aiEnabledCam ?? payload.aiEnabledCam,
            ai_features: res?.ai_features ?? payload.ai_features,
            storage_used_user: res?.storage_used_user ?? 0,
            vram_required: res?.vram_required ?? 0,
            cpuCores_required: res?.cpuCores_required ?? 0,
            ram_required: res?.ram_required ?? 0,
            created_at: res?.created_at ?? new Date().toISOString(),
          };

          this.costCalculated = true;
        },
        error: (err) => {
          this.loading = false;
          this.errorMsg =
            err?.error?.detail ||
            'Failed to calculate requirements';
        },
      });
  }

  /* =========================
     CLEAR
  ========================= */

  clearQuotation(): void {
    this.form.reset({
      cammera: null,
      storage_days: 30,
      aiEnabledCam: 0,
      ai_features: [],
    });

    this.costCalculated = false;
    this.requirements = null;
    this.errorMsg = null;
  }

  /* =========================
     HELPERS
  ========================= */

  get storageInTB(): number {
    return this.requirements
      ? this.requirements.storage_used_user / 1024
      : 0;
  }
}
