import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
} from '@angular/forms';
import { ToasterService } from '../service/toaster.service';

type TabKey = 'category' | 'camera' | 'ai' | 'hardware' | 'storage';

interface CameraPricing {
  id: number;
  min_cammera: number;
  max_cammera: number | null;
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

  // ✅ Loading / saving
  loading = false;
  saving = false;
  errorMsg: string | null = null;

  // ✅ Lists
  categoryList: Category[] = [];
  cameraList: CameraPricing[] = [];
  aiList: AiPricing[] = [];
  hardwareList: HardwarePricing[] = [];
  storageList: StorageCosting[] = [];

  // ✅ Edit IDs
  editingCategoryId: number | null = null;
  editingCameraId: number | null = null;
  editingAiId: number | null = null;
  editingHardwareId: number | null = null;
  editingStorageId: number | null = null;

  // ✅ API endpoints
  private CATEGORY_API = 'http://127.0.0.1:8001/pricing-Model/create-category/';
  private CAMERA_API = 'http://127.0.0.1:8001/pricing-Model/cameraPricing/';
  private AI_API = 'http://127.0.0.1:8001/pricing-Model/ai-feature/';
  private HARDWARE_API = 'http://127.0.0.1:8001/pricing-Model/processorUnit/';
  private STORAGE_API = 'http://127.0.0.1:8001/pricing-Model/storage-costing/';

  // ✅ Forms
  categoryForm!: FormGroup;
  cameraForm!: FormGroup;
  aiForm!: FormGroup;
  hardwareForm!: FormGroup;
  storageForm!: FormGroup;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private toast: ToasterService
  ) {
    // CATEGORY FORM
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
    });

    // CAMERA FORM
    this.cameraForm = this.fb.group({
      min_cammera: [1, [Validators.required, Validators.min(1)]],
      max_cammera: [null as number | null],
      costing: [0, [Validators.required, Validators.min(0)]],
    });

    // AI FORM
    this.aiForm = this.fb.group({
      AI_feature: ['', [Validators.required, Validators.minLength(2)]],
      costing: [0, [Validators.required, Validators.min(0)]],
    });

    // HARDWARE FORM
    this.hardwareForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      CPU: ['', [Validators.required, Validators.minLength(2)]],
      CPUcores: [1, [Validators.required, Validators.min(1)]],
      GPU: ['', [Validators.required, Validators.minLength(2)]],
      GPUcores: [1, [Validators.required, Validators.min(1)]],
      ram_required: [1, [Validators.required, Validators.min(1)]],
      costing: [0, [Validators.required, Validators.min(0)]],
    });

    // STORAGE FORM
    this.storageForm = this.fb.group({
      storage_per_cam: [0, [Validators.required, Validators.min(0)]],
      storage_perDay: [0, [Validators.required, Validators.min(0)]],
      costing: [0, [Validators.required, Validators.min(0)]],
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
    if (this.tab === 'category') this.loadCategoryList();
    if (this.tab === 'camera') this.loadCameraPricing();
    if (this.tab === 'ai') this.loadAiPricing();
    if (this.tab === 'hardware') this.loadHardwarePricing();
    if (this.tab === 'storage') this.loadStorageCosting();
  }

  // ==========================================================
  // ✅ CATEGORY CRUD (GET/POST/PATCH/PUT/DELETE)
  // ==========================================================
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

  editCategory(item: Category) {
    this.editingCategoryId = item.id;
    this.categoryForm.patchValue({ name: item.name });
  }

  cancelCategoryEdit() {
    this.editingCategoryId = null;
    this.categoryForm.reset({ name: '' });
  }

  saveCategory() {
    if (this.categoryForm.invalid) {
      this.toast.error('Please enter category name.');
      return;
    }

    // ✅ UPDATE (PATCH)
    if (this.editingCategoryId) {
      this.updateCategoryPatch();
      return;
    }

    // ✅ CREATE
    this.saving = true;
    this.http.post(this.CATEGORY_API, this.categoryForm.value).subscribe({
      next: () => {
        this.saving = false;
        this.toast.success('Category added ✅');
        this.cancelCategoryEdit();
        this.loadCategoryList();
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err?.error?.detail || 'Failed to add category.');
      },
    });
  }

  updateCategoryPatch() {
    if (!this.editingCategoryId) return;

    this.saving = true;
    this.http
      .patch(`${this.CATEGORY_API}${this.editingCategoryId}/`, this.categoryForm.value)
      .subscribe({
        next: () => {
          this.saving = false;
          this.toast.success('Category updated ✅');
          this.cancelCategoryEdit();
          this.loadCategoryList();
        },
        error: (err) => {
          this.saving = false;
          this.toast.error(err?.error?.detail || 'Failed to update category.');
        },
      });
  }

  updateCategoryPut() {
    if (!this.editingCategoryId) return;

    this.saving = true;
    this.http
      .put(`${this.CATEGORY_API}${this.editingCategoryId}/`, this.categoryForm.value)
      .subscribe({
        next: () => {
          this.saving = false;
          this.toast.success('Category updated ✅');
          this.cancelCategoryEdit();
          this.loadCategoryList();
        },
        error: (err) => {
          this.saving = false;
          this.toast.error(err?.error?.detail || 'Failed to update category.');
        },
      });
  }

  deleteCategory(id: number) {
    if (!confirm('Delete this category?')) return;

    this.saving = true;
    this.http.delete(`${this.CATEGORY_API}${id}/`).subscribe({
      next: () => {
        this.saving = false;
        this.toast.success('Category deleted ✅');
        if (this.editingCategoryId === id) this.cancelCategoryEdit();
        this.loadCategoryList();
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err?.error?.detail || 'Failed to delete category.');
      },
    });
  }

  // ==========================================================
  // ✅ CAMERA CRUD
  // ==========================================================
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

  editCamera(item: CameraPricing) {
    this.editingCameraId = item.id;
    this.cameraForm.patchValue({
      min_cammera: item.min_cammera,
      max_cammera: item.max_cammera,
      costing: item.costing,
    });
  }

  cancelCameraEdit() {
    this.editingCameraId = null;
    this.cameraForm.reset({ min_cammera: 1, max_cammera: null, costing: 0 });
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

    // ✅ UPDATE
    if (this.editingCameraId) {
      this.updateCameraPatch();
      return;
    }

    // ✅ CREATE
    this.saving = true;
    this.http.post(this.CAMERA_API, this.cameraForm.value).subscribe({
      next: () => {
        this.saving = false;
        this.toast.success('Camera pricing added ✅');
        this.cancelCameraEdit();
        this.loadCameraPricing();
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err?.error?.detail || 'Failed to add camera pricing.');
      },
    });
  }

  updateCameraPatch() {
    if (!this.editingCameraId) return;

    this.saving = true;
    this.http
      .patch(`${this.CAMERA_API}${this.editingCameraId}/`, this.cameraForm.value)
      .subscribe({
        next: () => {
          this.saving = false;
          this.toast.success('Camera updated ✅');
          this.cancelCameraEdit();
          this.loadCameraPricing();
        },
        error: (err) => {
          this.saving = false;
          this.toast.error(err?.error?.detail || 'Failed to update camera.');
        },
      });
  }

  updateCameraPut() {
    if (!this.editingCameraId) return;

    this.saving = true;
    this.http
      .put(`${this.CAMERA_API}${this.editingCameraId}/`, this.cameraForm.value)
      .subscribe({
        next: () => {
          this.saving = false;
          this.toast.success('Camera updated ✅');
          this.cancelCameraEdit();
          this.loadCameraPricing();
        },
        error: (err) => {
          this.saving = false;
          this.toast.error(err?.error?.detail || 'Failed to update camera.');
        },
      });
  }

  deleteCamera(id: number) {
    if (!confirm('Delete this camera pricing?')) return;

    this.saving = true;
    this.http.delete(`${this.CAMERA_API}${id}/`).subscribe({
      next: () => {
        this.saving = false;
        this.toast.success('Camera deleted ✅');
        if (this.editingCameraId === id) this.cancelCameraEdit();
        this.loadCameraPricing();
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err?.error?.detail || 'Failed to delete camera pricing.');
      },
    });
  }

  // ==========================================================
  // ✅ AI CRUD
  // ==========================================================
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

  editAi(item: AiPricing) {
    this.editingAiId = item.id;
    this.aiForm.patchValue({
      AI_feature: item.AI_feature,
      costing: item.costing,
    });
  }

  cancelAiEdit() {
    this.editingAiId = null;
    this.aiForm.reset({ AI_feature: '', costing: 0 });
  }

  saveAiPricing() {
    if (this.aiForm.invalid) {
      this.toast.error('Please fill AI feature properly.');
      return;
    }

    // ✅ UPDATE
    if (this.editingAiId) {
      this.updateAiPatch();
      return;
    }

    // ✅ CREATE
    this.saving = true;
    this.http.post(this.AI_API, this.aiForm.value).subscribe({
      next: () => {
        this.saving = false;
        this.toast.success('AI feature added ✅');
        this.cancelAiEdit();
        this.loadAiPricing();
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err?.error?.detail || 'Failed to add AI feature.');
      },
    });
  }

  updateAiPatch() {
    if (!this.editingAiId) return;

    this.saving = true;
    this.http.patch(`${this.AI_API}${this.editingAiId}/`, this.aiForm.value).subscribe({
      next: () => {
        this.saving = false;
        this.toast.success('AI updated ✅');
        this.cancelAiEdit();
        this.loadAiPricing();
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err?.error?.detail || 'Failed to update AI feature.');
      },
    });
  }

  updateAiPut() {
    if (!this.editingAiId) return;

    this.saving = true;
    this.http.put(`${this.AI_API}${this.editingAiId}/`, this.aiForm.value).subscribe({
      next: () => {
        this.saving = false;
        this.toast.success('AI updated ✅');
        this.cancelAiEdit();
        this.loadAiPricing();
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err?.error?.detail || 'Failed to update AI feature.');
      },
    });
  }

  deleteAi(id: number) {
    if (!confirm('Delete this AI feature?')) return;

    this.saving = true;
    this.http.delete(`${this.AI_API}${id}/`).subscribe({
      next: () => {
        this.saving = false;
        this.toast.success('AI deleted ✅');
        if (this.editingAiId === id) this.cancelAiEdit();
        this.loadAiPricing();
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err?.error?.detail || 'Failed to delete AI.');
      },
    });
  }

  // ==========================================================
  // ✅ HARDWARE CRUD
  // ==========================================================
  loadHardwarePricing() {
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

  editHardware(item: HardwarePricing) {
    this.editingHardwareId = item.id;
    this.hardwareForm.patchValue({
      name: item.name,
      CPU: item.CPU,
      CPUcores: item.CPUcores,
      GPU: item.GPU,
      GPUcores: item.GPUcores,
      ram_required: item.ram_required,
      costing: item.costing,
    });
  }

  cancelHardwareEdit() {
    this.editingHardwareId = null;
    this.hardwareForm.reset({
      name: '',
      CPU: '',
      CPUcores: 1,
      GPU: '',
      GPUcores: 1,
      ram_required: 1,
      costing: 0,
    });
  }

  saveHardwarePricing() {
    if (this.hardwareForm.invalid) {
      this.toast.error('Please fill CPU/GPU pricing properly.');
      return;
    }

    // ✅ UPDATE
    if (this.editingHardwareId) {
      this.updateHardwarePatch();
      return;
    }

    // ✅ CREATE
    this.saving = true;
    this.http.post(this.HARDWARE_API, this.hardwareForm.value).subscribe({
      next: () => {
        this.saving = false;
        this.toast.success('CPU GPU pricing saved ✅');
        this.cancelHardwareEdit();
        this.loadHardwarePricing();
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err?.error?.detail || 'Failed to save CPU GPU pricing.');
      },
    });
  }

  updateHardwarePatch() {
    if (!this.editingHardwareId) return;

    this.saving = true;
    this.http
      .patch(`${this.HARDWARE_API}${this.editingHardwareId}/`, this.hardwareForm.value)
      .subscribe({
        next: () => {
          this.saving = false;
          this.toast.success('Hardware updated ✅');
          this.cancelHardwareEdit();
          this.loadHardwarePricing();
        },
        error: (err) => {
          this.saving = false;
          this.toast.error(err?.error?.detail || 'Failed to update hardware.');
        },
      });
  }

  updateHardwarePut() {
    if (!this.editingHardwareId) return;

    this.saving = true;
    this.http
      .put(`${this.HARDWARE_API}${this.editingHardwareId}/`, this.hardwareForm.value)
      .subscribe({
        next: () => {
          this.saving = false;
          this.toast.success('Hardware updated ✅');
          this.cancelHardwareEdit();
          this.loadHardwarePricing();
        },
        error: (err) => {
          this.saving = false;
          this.toast.error(err?.error?.detail || 'Failed to update hardware.');
        },
      });
  }

  deleteHardware(id: number) {
    if (!confirm('Delete this hardware pricing?')) return;

    this.saving = true;
    this.http.delete(`${this.HARDWARE_API}${id}/`).subscribe({
      next: () => {
        this.saving = false;
        this.toast.success('Hardware deleted ✅');
        if (this.editingHardwareId === id) this.cancelHardwareEdit();
        this.loadHardwarePricing();
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err?.error?.detail || 'Failed to delete hardware.');
      },
    });
  }

  // ==========================================================
  // ✅ STORAGE CRUD
  // ==========================================================
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

  editStorage(item: StorageCosting) {
    this.editingStorageId = item.id;
    this.storageForm.patchValue({
      storage_per_cam: item.storage_per_cam,
      storage_perDay: item.storage_perDay,
      costing: item.costing,
    });
  }

  cancelStorageEdit() {
    this.editingStorageId = null;
    this.storageForm.reset({ storage_per_cam: 0, storage_perDay: 0, costing: 0 });
  }

  saveStorage() {
    if (this.storageForm.invalid) {
      this.toast.error('Please fill storage costing properly.');
      return;
    }

    // ✅ UPDATE
    if (this.editingStorageId) {
      this.updateStoragePatch();
      return;
    }

    // ✅ CREATE
    this.saving = true;
    this.http.post(this.STORAGE_API, this.storageForm.value).subscribe({
      next: () => {
        this.saving = false;
        this.toast.success('Storage costing added ✅');
        this.cancelStorageEdit();
        this.loadStorageCosting();
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err?.error?.detail || 'Failed to add storage costing.');
      },
    });
  }

  updateStoragePatch() {
    if (!this.editingStorageId) return;

    this.saving = true;
    this.http
      .patch(`${this.STORAGE_API}${this.editingStorageId}/`, this.storageForm.value)
      .subscribe({
        next: () => {
          this.saving = false;
          this.toast.success('Storage updated ✅');
          this.cancelStorageEdit();
          this.loadStorageCosting();
        },
        error: (err) => {
          this.saving = false;
          this.toast.error(err?.error?.detail || 'Failed to update storage.');
        },
      });
  }

  updateStoragePut() {
    if (!this.editingStorageId) return;

    this.saving = true;
    this.http
      .put(`${this.STORAGE_API}${this.editingStorageId}/`, this.storageForm.value)
      .subscribe({
        next: () => {
          this.saving = false;
          this.toast.success('Storage updated ✅');
          this.cancelStorageEdit();
          this.loadStorageCosting();
        },
        error: (err) => {
          this.saving = false;
          this.toast.error(err?.error?.detail || 'Failed to update storage.');
        },
      });
  }

  deleteStorage(id: number) {
    if (!confirm('Delete this storage costing?')) return;

    this.saving = true;
    this.http.delete(`${this.STORAGE_API}${id}/`).subscribe({
      next: () => {
        this.saving = false;
        this.toast.success('Storage deleted ✅');
        if (this.editingStorageId === id) this.cancelStorageEdit();
        this.loadStorageCosting();
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err?.error?.detail || 'Failed to delete storage.');
      },
    });
  }

  // ✅ trackBy
  trackById(_: number, item: any) {
    return item.id;
  }
}
