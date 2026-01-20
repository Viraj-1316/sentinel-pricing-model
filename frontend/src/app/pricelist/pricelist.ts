import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ToasterService } from '../service/toaster.service';

type TabKey = 'category' | 'camera' | 'ai' | 'hardware'| 'storage';

interface CameraPricing {
  id: number;
  min_cammera: number;
  max_cammera: number | null;
  // Processor?: string;
  costing: number;
}

interface AiPricing {
  id: number;
  AI_feature: string;
  costing: number;
}
interface Category {
  id: number;
  name: string;
}
/** ✅ UPDATED: CPU GPU Pricing Interface */
interface HardwarePricing {
  id: number;
  name: string;
  CPU: string;
  CPUcores: number;
  GPU: string;
  GPUcores: number;
  ram_required: number;
  costing: number;
}
interface StorageCosting {
  id: number;
  storage_per_cam: number;
  storage_perDay: number;
  costing: number;
}
@Component({
  selector: 'app-pricelist',
  standalone: true,
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule],
  templateUrl: './pricelist.html',
  styleUrl: './pricelist.css',
})
export class Pricelist implements OnInit {

  // ✅ Active tab
  tab: TabKey = 'camera';

  // ✅ Loading state
  loading = false;
  saving = false;
  errorMsg: string | null = null;
categoryList: Category[] = [];
categoryForm!: FormGroup;

  // ✅ Lists
  cameraList: CameraPricing[] = [];
  aiList: AiPricing[] = [];
  hardwareList: HardwarePricing[] = [];
  storageList: StorageCosting[] = [];
private CATEGORY_API = 'http://127.0.0.1:8001/pricing-Model/create-category/';
  // ✅ API endpoints
  private CAMERA_API = 'http://127.0.0.1:8001/pricing-Model/cameraPricing/';
  private AI_API = 'http://127.0.0.1:8001/pricing-Model/ai-feature/';
  private HARDWARE_API = 'http://127.0.0.1:8001/pricing-Model/processorUnit/'; // connect backend later
  private STORAGE_API = 'http://127.0.0.1:8001/pricing-Model/storage-costing/';
  // ✅ Forms
  cameraForm!: FormGroup;
  aiForm!: FormGroup;
  hardwareForm!: FormGroup;
  storageForm!: FormGroup;
  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private toast: ToasterService
  ) {
this.categoryForm = this.fb.group({
  name: ['', [Validators.required, Validators.minLength(2)]],
});

    // ✅ CAMERA FORM
    this.cameraForm = this.fb.group({
      min_cammera: [1, [Validators.required, Validators.min(1)]],
      max_cammera: [null as number | null],
      costing: [0, [Validators.required, Validators.min(0)]],
    });

    // ✅ AI FORM
    this.aiForm = this.fb.group({
      AI_feature: ['', [Validators.required, Validators.minLength(2)]],
      costing: [0, [Validators.required, Validators.min(0)]],
    });

    // ✅ CPU GPU PRICING FORM (FIXED)
    this.hardwareForm = this.fb.group({
      name:['',[Validators.required,Validators.minLength(2)]],
      CPU: ['', [Validators.required, Validators.minLength(2)]],
      CPUcores: [0, [Validators.required, Validators.min(1)]],
      GPU: ['', [Validators.required, Validators.minLength(2)]],
      GPUcores: [0, [Validators.required, Validators.min(1)]],
      ram_required: [0, [Validators.required, Validators.min(1)]],
      costing: [0, [Validators.required, Validators.min(0)]],
    });

    this.storageForm = this.fb.group({
      storage_per_cam: [0, [Validators.required, Validators.min(0)]],
      storage_perDay: [0, [Validators.required, Validators.min(0)]],
      costing: [0, [Validators.required, Validators.min(0)]],
    });

  }

  ngOnInit(): void {
    this.loadCurrentTabData();
  }
loadCategoryList() {
  this.loading = true;
  this.http.get<Category[]>(this.CATEGORY_API).subscribe({
    next: (res) => {
      this.loading = false;
      this.categoryList = res || [];
    },
    error: (err) => {
      this.loading = false;
      this.errorMsg = err?.error?.detail || 'Failed to load categories.';
    },
  });
}
saveCategory() {
  if (this.categoryForm.invalid) {
    this.toast.error('Please enter category name.');
    return;
  }

  this.saving = true;

  this.http.post(this.CATEGORY_API, this.categoryForm.value).subscribe({
    next: () => {
      this.saving = false;
      this.toast.success('Category added ✅');
      this.categoryForm.reset({ name: '' });
      this.loadCategoryList();
    },
    error: (err) => {
      this.saving = false;
      this.toast.error(err?.error?.detail || 'Failed to add category.');
    },
  });
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
      if (this.tab === 'category') this.loadCategoryList();  
    if (this.tab === 'camera') this.loadCameraPricing();
    if (this.tab === 'ai') this.loadAiPricing();
    if (this.tab === 'hardware') this.loadHardwarePricing();
    if (this.tab === 'storage') this.loadStorageCosting();
      // Implement loadStorageCosting() if backend exists
    
  }
saveStorage(){
if (this.storageForm.invalid) {
      this.toast.error('Please fill storage costing properly.');
      return;
    }

    this.storageForm.value.storage_per_cam;
    this.storageForm.value.storage_perDay;

   

    this.saving = true;

    this.http.post(this.STORAGE_API, this.storageForm.value).subscribe({
      next: () => {
        this.saving = false;
        this.toast.success('Storage costing added ✅');
        this.storageForm.reset({ storage_per_cam: 0, storage_perDay: 0, costing: 0 });
        this.loadStorageCosting();
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err?.error?.detail || 'Failed to add storage costing.');
      },
    });
  }
  loadStorageCosting() {
    this.loading = true;
    this.http.get<StorageCosting[]>(this.STORAGE_API).subscribe({
      next: (res) => {
        this.loading = false;
        this.storageList = res || [];
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.detail || 'Failed to load storage costing.';
      },
    });
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
        this.cameraForm.reset({ min_cammera: 1, max_cammera: null, costing: 0 });
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
  // ✅ CPU GPU PRICING
  // ==========================
  loadHardwarePricing() {
    // ✅ If backend exists, enable this
    this.loading = true;

    this.http.get<HardwarePricing[]>(this.HARDWARE_API).subscribe({
      next: (res) => {
        this.loading = false;
        this.hardwareList = res || [];
      },
      error: () => {
        this.loading = false;
        this.hardwareList = [];
      },
    });
  }

  saveHardwarePricing() {
    if (this.hardwareForm.invalid) {
      this.toast.error('Please fill CPU/GPU pricing properly.');
      return;
    }

    this.saving = true;

    // ✅ If backend exists, enable this
    this.http.post(this.HARDWARE_API, this.hardwareForm.value).subscribe({
      next: () => {
        this.saving = false;
        this.toast.success('CPU GPU pricing saved ✅');

        this.hardwareForm.reset({
          name: '',
          CPU: '',
          CPUcores: 0,
          GPU: '',
          GPUcores: 0,
          ram_required: 0,
          costing: 0
        });

        this.loadHardwarePricing();
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err?.error?.detail || 'Failed to save CPU GPU pricing.');
      },
    });
  }

  trackById(_: number, item: any) {
    return item.id;
  }
}
