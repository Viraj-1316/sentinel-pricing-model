import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-user-requirements',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './user-requirements.html',
  styleUrl: './user-requirements.css',
})

export class UserRequirements implements OnInit {
includeCPU = true;
  includeGPU = true;
  includeAI = true;
  includeStorage = true;
  // ---------- FORM ----------
  form!: FormGroup;

  // ---------- UI STATE ----------
  loading = false;
  costCalculated = false;
  errorMsg = '';

  // ---------- RESULT ----------
  requirements: any = null;
  storageInTB = 0;

  // ---------- AI ----------
  aiFeatures: any[] = [];
  selectedFeatures: any[] = [];
  aiCamMoreThanTotal = false;
 

  
  // ---------- API ----------
  private AI_FEATURES_API =
    'http://127.0.0.1:8001/pricing-Model/ai-feature/';

  private CALCULATE_API =
    'http://127.0.0.1:8001/pricing-Model/Pricingcalculation/';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {}

  // ================= INIT =================
  ngOnInit(): void {
    this.initForm();
    this.loadAiFeatures();
  }

  // ================= FORM INIT =================
  private initForm(): void {
    this.form = this.fb.group({
      cammera: [null],
      storage_days: [null],
      aiEnabledCam: [null],
      ai_features: [[]],
      storage_used_user: [null] // <-- for future use if needed
    });
  }

  // ================= LOAD AI FEATURES =================
  loadAiFeatures(): void {
    this.http.get<any[]>(this.AI_FEATURES_API).subscribe({
      next: (res) => {
        this.aiFeatures = res || [];
      },
      error: () => {
        this.errorMsg = 'Failed to load AI features';
      }
    });
  }

  // ================= CALCULATE =================
  calculateCost(): void {
    this.errorMsg = '';
    this.loading = true;

    const cam = Number(this.form.value.cammera);
    const days = Number(this.form.value.storage_days);
    const aiCam = Number(this.form.value.aiEnabledCam || 0);

    // ---- VALIDATION ----
    if (cam <= 0 || days <= 0) {
      this.errorMsg = 'Please enter valid camera count and storage days';
      this.loading = false;
      return;
    }

    this.aiCamMoreThanTotal = aiCam > cam;
    if (this.aiCamMoreThanTotal) {
      this.loading = false;
      return;
    }

    // ---- API CALL ----
    this.http.post<any>(this.CALCULATE_API, this.form.value).subscribe({
      next: (res) => {
        // Store full response
        this.requirements = res;

        // Patch storage into form (optional but safe)
        this.form.patchValue({
          storage_used_user: res.storage_used_user
        });

        // Convert to TB for UI
        this.storageInTB = res.storage_used_user
          ? res.storage_used_user / 1024
          : 0;

        this.costCalculated = true;
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Calculation failed';
        this.loading = false;
      }
    });
  }

  // ================= CLEAR =================
  clearQuotation(): void {
    this.form.reset({
      cammera: null,
      storage_days: null,
      aiEnabledCam: null,
      ai_features: [],
      storage_used_user: null
    });

    this.selectedFeatures = [];
    this.requirements = null;
    this.costCalculated = false;
    this.aiCamMoreThanTotal = false;
    this.errorMsg = '';
    this.storageInTB = 0;
  }

goToQuotationForm(): void {
  if (!this.costCalculated || !this.requirements?.id) return;

  const quotationId = this.requirements.id;

  this.loading = true;

  this.http.patch<any>(
    `${this.CALCULATE_API}${quotationId}/`,
    {} // 👈 EMPTY PATCH = default quotation pricing
  ).subscribe({
    next: () => {
      this.loading = false;
      this.router.navigate(['/qoutation-form', quotationId]);
    },
    error: () => {
      this.errorMsg = 'Failed to generate quotation';
      this.loading = false;
    }
  });
}


  onback(): void {
    this.router.navigate(['/dashboard']);
  }

  // ================= AI FEATURE LOGIC =================
  onToggleFeature(id: number, event: any): void {
    const selectedIds: number[] = this.form.value.ai_features || [];

    if (event.target.checked) {
      const feature = this.aiFeatures.find(f => f.id === id);
      if (feature && !selectedIds.includes(id)) {
        this.selectedFeatures.push(feature);
        this.form.patchValue({
          ai_features: [...selectedIds, id]
        });
      }
    } else {
      this.removeFeature(id);
    }
  }

  removeFeature(id: number): void {
    this.selectedFeatures =
      this.selectedFeatures.filter(f => f.id !== id);

    const updatedIds =
      (this.form.value.ai_features as number[])
        .filter(fid => fid !== id);

    this.form.patchValue({
      ai_features: updatedIds
    });
  }
}
