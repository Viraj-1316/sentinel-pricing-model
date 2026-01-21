import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { ToasterService } from '../service/toaster.service';
import { ConfirmdialogService } from '../service/confirmdialog.service';

export interface AIEnabled {
  id: number;
  AI_feature: string;
  costing: number;
}

export interface CameraPricingSlab {
  id: number;
  min_cammera: number;
  max_cammera: number | null;
  costing: number;
  total_costing?: number;
}

export interface HardwarePricing {
  id: number;
  name: string;
  CPU: string;
  CPUcores: number;
  GPU: string;
  GPUcores: number;
  ram_required: number;
  costing: number;
}

export interface StorageCosting {
  id: number;
  storage_per_cam: number;
  storage_perDay: number;
  costing: number;
}

type RightTab = 'camera' | 'ai' | 'compute' | 'storage' | 'preview';
type WizardStep = 1 | 2 | 3 | 4 | 5;


@Component({
  selector: 'app-user-requirements',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HttpClientModule, RouterLink],
  templateUrl: './user-requirements.html',
  styleUrl: './user-requirements.css',
})
export class UserRequirements implements OnInit {

step: WizardStep = 1;

// ✅ which step is allowed
maxStepReached: WizardStep = 1;

goToStep(s: WizardStep) {
  // allow only already reached steps (enterprise UX)
  if (s <= this.maxStepReached) {
    this.step = s;
    this.syncRightPanel();
  }
}

nextStep() {
  // validation per step
  const ok = this.validateStep(this.step);
  if (!ok) return;

  if (this.step < 5) {
    this.step = (this.step + 1) as WizardStep;
    if (this.step > this.maxStepReached) this.maxStepReached = this.step;
    this.syncRightPanel();
  }
}

prevStep() {
  if (this.step > 1) {
    this.step = (this.step - 1) as WizardStep;
    this.syncRightPanel();
  }
}

// ✅ maps step → right tab
syncRightPanel() {
  if (this.step === 1) this.activeTab = 'camera';
  if (this.step === 2) this.activeTab = 'storage';
  if (this.step === 3) this.activeTab = 'compute';
  if (this.step === 4) this.activeTab = 'ai';
  if (this.step === 5) this.activeTab = 'preview';
}
validateStep(step: WizardStep): boolean {
  if (step === 1) {
    const cam = this.form.get('cammera');
    if (!cam || cam.invalid) {
      cam?.markAsTouched();
      this.toaster.error('Please enter valid camera count.');
      return false;
    }
    return true;
  }

  if (step === 2) {
    const days = this.form.get('storage_days');
    if (!days || days.invalid) {
      days?.markAsTouched();
      this.toaster.error('Please enter valid storage days.');
      return false;
    }
    return true;
  }

  if (step === 3) {
    // optional requirement
    // allow skip cpu/gpu (but recommended)
    return true;
  }

  if (step === 4) {
    // AI selection optional
    return true;
  }

  return true;
}

  form: FormGroup;

  loading = false;
  errorMsg: string | null = null;

  aiFeatures: AIEnabled[] = [];
  cameraPricing: CameraPricingSlab[] = [];

  hardwareList: HardwarePricing[] = [];
  storageList: StorageCosting[] = [];

  selectedHardware: HardwarePricing | null = null;
  hardwareSearch = '';

  quotation: any = null;

  totalAiCost = 0;
  totalCost: number | null = null;

  costCalculated = false;
  quotationGenerated = false;

  // ✅ Right panel tabs
  activeTab: RightTab = 'camera';

  // ✅ camera slab highlight
  selectedCameraSlab: CameraPricingSlab | null = null;

  // ✅ API endpoints
  private CAMERA_PRICING_API = 'http://127.0.0.1:8001/pricing-Model/cameraPricing/';
  private AI_API = 'http://127.0.0.1:8001/pricing-Model/ai-feature/';
  private HARDWARE_API = 'http://127.0.0.1:8001/pricing-Model/processorUnit/';
  private STORAGE_API = 'http://127.0.0.1:8001/pricing-Model/storage-costing/';
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
      storage_days: [30, [Validators.required, Validators.min(1)]],
      hardware_id: [null],
      ai_features: [[]],
    });
  }

  ngOnInit(): void {
    this.fetchCameraPricing();
    this.fetchAIFeatures();
    this.fetchHardwarePricing();
    this.fetchStorageCosting();

    // ✅ camera input changes: highlight slab + show camera tab
    this.form.get('cammera')?.valueChanges.subscribe((value: any) => {
      const cam = Number(value || 0);
      this.selectedCameraSlab = this.findMatchingSlab(cam);
      if (!this.quotationGenerated) this.activeTab = 'camera';
    });

    // ✅ AI selection changes: update total + show ai tab
    this.form.get('ai_features')?.valueChanges.subscribe((selectedIds: number[]) => {
      this.totalAiCost = this.calculateAiCost(selectedIds || []);
      if ((selectedIds || []).length > 0 && !this.quotationGenerated) this.activeTab = 'ai';
    });

    // ✅ reset flow if user edits anything
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

  trackById(_: number, item: any) {
    return item?.id;
  }

  // ==========================
  // ✅ Navigation
  // ==========================
  back(): void {
    this.router.navigateByUrl('/dashboard');
  }

  async onback() {
    const ok = await this.confirm.open('Confirmation', 'Want to go back to Dashboard?');
    if (ok) this.back();
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
      error: () => console.log('❌ Failed to load camera pricing'),
    });
  }

  private findMatchingSlab(cameras: number): CameraPricingSlab | null {
    if (!cameras || this.cameraPricing.length === 0) return null;

    const slab =
      this.cameraPricing
        .filter(s => Number(s.min_cammera) <= cameras)
        .filter(s => s.max_cammera === null || Number(s.max_cammera) >= cameras)
        .sort((a, b) => Number(a.min_cammera) - Number(b.min_cammera))[0] || null;

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

    const updated = checked
      ? (current.includes(id) ? current : [...current, id])
      : current.filter(x => x !== id);

    this.form.patchValue({ ai_features: updated });
  }

  removeFeature(id: number): void {
    const current: number[] = this.form.value.ai_features || [];
    this.form.patchValue({ ai_features: current.filter(x => x !== id) });
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
  // ✅ Hardware Pricing
  // ==========================
  fetchHardwarePricing(): void {

    this.http.get<HardwarePricing[]>(this.HARDWARE_API).subscribe({
      next: (res) => {
        console.log('✅ Hardware pricing loaded');
        this.hardwareList = res || [];
      },
      error: () => (this.hardwareList = []),
    });
  }

  filteredHardwareList(): HardwarePricing[] {
    const q = (this.hardwareSearch || '').toLowerCase().trim();
    if (!q) return this.hardwareList;

    return this.hardwareList.filter(hw =>
      (hw.name || '').toLowerCase().includes(q) ||
      (hw.CPU || '').toLowerCase().includes(q) ||
      (hw.GPU || '').toLowerCase().includes(q)
    );
  }

  selectHardware(hw: HardwarePricing): void {
    this.selectedHardware = hw;
    this.form.patchValue({ hardware_id: hw.id });

    // open compute tab when selected
    if (!this.quotationGenerated) this.activeTab = 'compute';
  }

  // ==========================
  // ✅ Storage Costing
  // ==========================
  fetchStorageCosting(): void {
    this.http.get<StorageCosting[]>(this.STORAGE_API).subscribe({
      next: (res) => (this.storageList = res || []),
      error: () => (this.storageList = []),
    });
  }

  // ==========================
  // ✅ Step 1: Calculate Cost
  // ==========================
  calculateCost(): void {
    this.errorMsg = null;
    this.totalCost = null;

    this.costCalculated = false;
    this.quotationGenerated = false;
    this.quotation = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toaster.error('Please fill required fields.');
      return;
    }

    const payload = {
      cammera: Number(this.form.value.cammera),
      storage_days: Number(this.form.value.storage_days),
      hardware_id: this.form.value.hardware_id,
      ai_features: this.form.value.ai_features || [],
    };

    this.loading = true;

    this.http.post(this.QUOTE_API, payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.totalCost = res?.total_costing ?? null;
        this.costCalculated = true;

        this.toaster.success('Cost calculated ✅');
        this.activeTab = 'camera';
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.detail || 'Failed to calculate cost.';
        this.toaster.error('Cost calculation failed ❌');
      },
    });
  }

  // ==========================
  // ✅ Step 2: Generate Quotation
  // ==========================
  generateQuotation(): void {
    this.errorMsg = null;

    if (!this.costCalculated || this.totalCost === null) {
      this.errorMsg = 'Please calculate cost first.';
      this.toaster.error('Calculate cost first');
      return;
    }

    this.loading = true;

    this.http.get<any[]>(this.QUOTATION_API).subscribe({
      next: (res: any[]) => {
        this.loading = false;

        if (!res || res.length === 0) {
          this.errorMsg = 'No quotation found.';
          return;
        }

        this.quotation = res[0];
        this.totalCost = this.quotation?.total_costing ?? this.totalCost;
        this.quotationGenerated = true;

        this.activeTab = 'preview';
        this.toaster.success('Quotation generated ✅');
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.detail || 'Failed to load quotation preview.';
        this.toaster.error('Quotation failed ❌');
      },
    });
  }

  // ==========================
  // ✅ PDF
  // ==========================
  downloadPdf(): void {
    if (!this.quotation?.id) {
      this.toaster.error('Generate quotation first');
      return;
    }

    const url = `http://127.0.0.1:8001/pricing-Model/quotation/${this.quotation.id}/pdf/`;
    const token = localStorage.getItem('access_token');

    this.loading = true;

    this.http.get(url, {
      responseType: 'blob',
      headers: { Authorization: `Bearer ${token}` },
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
      error: () => {
        this.loading = false;
        this.toaster.error('PDF download failed ❌');
      },
    });
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
      .post(`http://127.0.0.1:8001/pricing-Model/quotation/${this.quotation.id}/send-email/`, {})
      .subscribe({
        next: () => {
          this.loading = false;
          this.toaster.success('Email sent ✅');
        },
        error: () => {
          this.loading = false;
          this.toaster.error('Email failed ❌');
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
