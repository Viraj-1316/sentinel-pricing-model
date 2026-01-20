import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ToasterService } from '../service/toaster.service';

type TabKey = 'camera' | 'ai' | 'hardware';

interface CameraPricing {
  id: number;
  min_cammera: number;
  max_cammera: number | null;
  Processor?: string;
  total_costing: number;
}

interface AiPricing {
  id: number;
  AI_feature: string;
  costing: number;
}

interface HardwarePricing {
  id: number;
  name: string;
  cost: number;
}

@Component({
  selector: 'app-pricelist',
  standalone: true,
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule],
  templateUrl: './pricelist.html',
  styleUrl: './pricelist.css',
})
export class PriceList implements OnInit {

  // ✅ Active tab
  tab: TabKey = 'camera';

  // ✅ Loading state
  loading = false;
  saving = false;
  errorMsg: string | null = null;

  // ✅ Lists
  cameraList: CameraPricing[] = [];
  aiList: AiPricing[] = [];
  hardwareList: HardwarePricing[] = [];

  // ✅ API endpoints
  private CAMERA_API = 'http://127.0.0.1:8001/pricing-Model/cameraPricing/';
  private AI_API = 'http://127.0.0.1:8001/pricing-Model/ai-feature/';
  private HARDWARE_API = 'http://127.0.0.1:8001/pricing-Model/hardware-pricing/'; // optional later

  // ✅ Forms (declare only)
  cameraForm!: FormGroup;
  aiForm!: FormGroup;
  hardwareForm!: FormGroup;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private toast: ToasterService
  ) {
    // ✅ Initialize forms INSIDE constructor (fb is ready now)
    this.cameraForm = this.fb.group({
      min_cammera: [1, [Validators.required, Validators.min(1)]],
      max_cammera: [null as number | null],
      total_costing: [0, [Validators.required, Validators.min(0)]],
    });

    this.aiForm = this.fb.group({
      AI_feature: ['', [Validators.required, Validators.minLength(2)]],
      costing: [0, [Validators.required, Validators.min(0)]],
    });

    this.hardwareForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      cost: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.loadCurrentTabData();
  }

  // ✅ Tab switching
  setTab(key: TabKey) {
    if (this.tab === key) return;
    this.tab = key;
    this.errorMsg = null;
    this.loadCurrentTabData();
  }

  // ✅ Load list based on tab
  loadCurrentTabData() {
    if (this.tab === 'camera') this.loadCameraPricing();
    if (this.tab === 'ai') this.loadAiPricing();
    if (this.tab === 'hardware') this.loadHardwarePricing();
  }

  // ==========================
  // ✅ CAMERA PRICING
  // ==========================
  loadCameraPricing() {
    this.loading = true;
    this.http.get<CameraPricing[]>(this.CAMERA_API).subscribe({
      next: (res) => {
        this.loading = false;
        this.cameraList = res || [];
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.detail || 'Failed to load camera pricing.';
      },
    });
  }

  saveCameraPricing() {
    if (this.cameraForm.invalid) {
      this.toast.error('Please fill camera pricing properly.');
      return;
    }

    const min = this.cameraForm.value.min_cammera;
    const max = this.cameraForm.value.max_cammera;

    if (max !== null && max !== undefined && max < min) {
      this.toast.error('Max cameras must be greater than Min cameras.');
      return;
    }

    this.saving = true;

    this.http.post(this.CAMERA_API, this.cameraForm.value).subscribe({
      next: () => {
        this.saving = false;
        this.toast.success('Camera pricing added ✅');
        this.cameraForm.reset({ min_cammera: 1, max_cammera: null, total_costing: 0 });
        this.loadCameraPricing();
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err?.error?.detail || 'Failed to add camera pricing.');
      },
    });
  }

  // ==========================
  // ✅ AI PRICING
  // ==========================
  loadAiPricing() {
    this.loading = true;
    this.http.get<AiPricing[]>(this.AI_API).subscribe({
      next: (res) => {
        this.loading = false;
        this.aiList = res || [];
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.detail || 'Failed to load AI pricing.';
      },
    });
  }

  saveAiPricing() {
    if (this.aiForm.invalid) {
      this.toast.error('Please fill AI feature properly.');
      return;
    }

    this.saving = true;

    this.http.post(this.AI_API, this.aiForm.value).subscribe({
      next: () => {
        this.saving = false;
        this.toast.success('AI feature added ✅');
        this.aiForm.reset({ AI_feature: '', costing: 0 });
        this.loadAiPricing();
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err?.error?.detail || 'Failed to add AI feature.');
      },
    });
  }

  // ==========================
  // ✅ HARDWARE PRICING
  // ==========================
  loadHardwarePricing() {
    this.hardwareList = [];
  }

  saveHardwarePricing() {
    this.toast.info('Hardware API not connected yet.');
  }

  trackById(_: number, item: any) {
    return item.id;
  }
}
