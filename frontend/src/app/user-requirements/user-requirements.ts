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

  form!: FormGroup;

  loading = false;
  costCalculated = false;
  errorMsg = '';

  requirements: any = null;
  storageInTB = 0;

  aiFeatures: any[] = [];
  selectedFeatures: any[] = [];
  aiCamMoreThanTotal = false;
 
  // Store backend license data
  DurationU: any[] = []; 
  
  private AI_FEATURES_API = 'http://127.0.0.1:8001/pricing-Model/ai-feature/';
  private CALCULATE_API = 'http://127.0.0.1:8001/pricing-Model/Pricingcalculation/';
  private LICENSE_API = 'http://127.0.0.1:8001/pricing-Model/processorUnit/';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadAiFeatures();
    this.loadLicenseDurations();
  }

  private initForm(): void {
    this.form = this.fb.group({
      cammera: [null],
      storage_days: [null],
      aiEnabledCam: [null],
      ai_features: [[]],
      DurationU: [null], // Bound to the license dropdown
      storage_used_user: [null]
    });
  }

  getFeatureName(id: number): string {
    return this.aiFeatures.find(f => f.id === id)?.AI_feature || '';
  }

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

  loadLicenseDurations(): void {
    this.http.get<any[]>(this.LICENSE_API).subscribe({
      next: (res) => this.DurationU = res || [],
      error: () => {
        this.errorMsg = 'Failed to load licenses';
      }
    });
  }

  calculateCost(): void {
    this.errorMsg = '';
    this.loading = true;

    const cam = Number(this.form.value.cammera);
    const days = Number(this.form.value.storage_days);
    const aiCam = Number(this.form.value.aiEnabledCam || 0);

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

    this.http.post<any>(this.CALCULATE_API, this.form.value).subscribe({
      next: (res) => {
        this.requirements = res;
        this.form.patchValue({
          storage_used_user: res.storage_used_user
        });
        this.storageInTB = res.storage_used_user ? res.storage_used_user / 1024 : 0;
        this.costCalculated = true;
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Calculation failed';
        this.loading = false;
      }
    });
  }

  clearQuotation(): void {
    this.form.reset({
      cammera: null,
      storage_days: null,
      aiEnabledCam: null,
      ai_features: [],
      DurationU: null,
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

    const API_URL = `http://127.0.0.1:8001/pricing-Model/Pricingcalculation/${this.requirements.id}/`;

    const payload = {
      include_cpu: this.includeCPU,
      include_gpu: this.includeGPU,
      include_ai: this.includeAI,
      include_storage: this.includeStorage
    };

    this.loading = true;

    this.http.patch<any>(API_URL, payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.router.navigate(['/qoutation-form', res.id]);
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        alert('Failed to generate quotation');
      }
    });
  }

  onback(): void {
    this.router.navigate(['/dashboard']);
  }

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
    this.selectedFeatures = this.selectedFeatures.filter(f => f.id !== id);
    const updatedIds = (this.form.value.ai_features as number[]).filter(fid => fid !== id);
    this.form.patchValue({
      ai_features: updatedIds
    });
  }
}