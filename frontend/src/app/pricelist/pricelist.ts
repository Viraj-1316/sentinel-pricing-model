import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ToasterService } from '../service/toaster.service';

type TabKey = 'category' | 'ai' | 'hardware' | 'storage';
type HardwareTab = 'cpu' | 'gpu';

@Component({
  selector: 'app-pricelist',
  standalone: true,
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule],
  templateUrl: './pricelist.html',
})
export class Pricelist implements OnInit {

  tab: TabKey = 'category';
  hardwareTab: HardwareTab = 'cpu';

  categoryList: any[] = [];
  aiList: any[] = [];
  cpuList: any[] = [];
  gpuList: any[] = [];
  storageList: any[] = [];

  editingCategoryId: number | null = null;
  editingAiId: number | null = null;
  editingCpuId: number | null = null;
  editingGpuId: number | null = null;
  editingStorageId: number | null = null;

  private CATEGORY_API = 'http://127.0.0.1:8001/pricing-Model/create-category/';
  private AI_API       = 'http://127.0.0.1:8001/pricing-Model/ai-feature/';
  private HARDWARE_API = 'http://127.0.0.1:8001/pricing-Model/cameraPricing/';
  private STORAGE_API  = 'http://127.0.0.1:8001/pricing-Model/storage-costing/';

  categoryForm: FormGroup;
  aiForm: FormGroup;
  cpuForm: FormGroup;
  gpuForm: FormGroup;
  storageForm: FormGroup;

  constructor(private http: HttpClient, private fb: FormBuilder, private toast: ToasterService) {
    this.categoryForm = this.fb.group({ name: ['', Validators.required] });
    this.aiForm = this.fb.group({ AI_feature: ['', Validators.required], costing: [0, Validators.required] });
    
    this.cpuForm = this.fb.group({
      min_cammera: [1, Validators.required],
      max_cammera: [null],
      core_hardware: ['', Validators.required],
      CPUcores: [1, Validators.required],
      ram_required: [1, Validators.required],
      costing: [0, Validators.required],
    });

    this.gpuForm = this.fb.group({
      min_cammeraA: [1, Validators.required],
      max_cammeraA: [null],
      AI_Component: ['', Validators.required],
      VRAM: ['', Validators.required],
      costing: [0, Validators.required],
    });

    this.storageForm = this.fb.group({
      storage_per_cam: [0, Validators.required],
      storage_perDay: [0, Validators.required],
      costing: [0, Validators.required],
    });
  }

  ngOnInit(): void { this.loadCurrentTab(); }

  setTab(tab: TabKey) { this.tab = tab; this.resetStates(); this.loadCurrentTab(); }
  setHardwareTab(tab: HardwareTab) { this.hardwareTab = tab; this.resetStates(); }

  resetStates() {
    this.editingCategoryId = this.editingAiId = this.editingCpuId = this.editingGpuId = this.editingStorageId = null;
    this.categoryForm.reset();
    this.aiForm.reset({costing: 0});
    this.cpuForm.reset({min_cammera: 1, CPUcores: 1, ram_required: 1, costing: 0});
    this.gpuForm.reset({min_cammeraA: 1, costing: 0});
    this.storageForm.reset({storage_per_cam: 0, storage_perDay: 0, costing: 0});
  }

  loadCurrentTab() {
    if (this.tab === 'category') this.loadCategories();
    else if (this.tab === 'ai') this.loadAi();
    else if (this.tab === 'hardware') this.loadHardware();
    else if (this.tab === 'storage') this.loadStorage();
  }

  // CATEGORY
  loadCategories() { this.http.get<any[]>(this.CATEGORY_API).subscribe(res => this.categoryList = res); }
  saveCategory() {
    const req = this.editingCategoryId ? this.http.patch(`${this.CATEGORY_API}${this.editingCategoryId}/`, this.categoryForm.value) : this.http.post(this.CATEGORY_API, this.categoryForm.value);
    req.subscribe(() => { this.toast.success('Category Saved'); this.resetStates(); this.loadCategories(); });
  }
  editCategory(c: any) { this.editingCategoryId = c.id; this.categoryForm.patchValue(c); }
  deleteCategory(id: number) { this.http.delete(`${this.CATEGORY_API}${id}/`).subscribe(() => this.loadCategories()); }

  // AI
  loadAi() { this.http.get<any[]>(this.AI_API).subscribe(res => this.aiList = res); }
  saveAi() {
    const req = this.editingAiId ? this.http.patch(`${this.AI_API}${this.editingAiId}/`, this.aiForm.value) : this.http.post(this.AI_API, this.aiForm.value);
    req.subscribe(() => { this.toast.success('AI Feature Saved'); this.resetStates(); this.loadAi(); });
  }
  editAi(a: any) { this.editingAiId = a.id; this.aiForm.patchValue(a); }
  deleteAi(id: number) { this.http.delete(`${this.AI_API}${id}/`).subscribe(() => this.loadAi()); }

  // HARDWARE
  loadHardware() {
    this.http.get<any[]>(this.HARDWARE_API).subscribe(res => {
      this.cpuList = res.filter(x => x.core_hardware);
      this.gpuList = res.filter(x => x.AI_Component);
    });
  }
  saveCpu() {
    const req = this.editingCpuId ? this.http.patch(`${this.HARDWARE_API}${this.editingCpuId}/`, this.cpuForm.value) : this.http.post(this.HARDWARE_API, this.cpuForm.value);
    req.subscribe(() => { this.toast.success('CPU saved'); this.resetStates(); this.loadHardware(); });
  }
  editCpu(c: any) { this.editingCpuId = c.id; this.cpuForm.patchValue(c); }
  deleteCpu(id: number) { this.http.delete(`${this.HARDWARE_API}${id}/`).subscribe(() => this.loadHardware()); }

  saveGpu() {
    const req = this.editingGpuId ? this.http.patch(`${this.HARDWARE_API}${this.editingGpuId}/`, this.gpuForm.value) : this.http.post(this.HARDWARE_API, this.gpuForm.value);
    req.subscribe(() => { this.toast.success('GPU saved'); this.resetStates(); this.loadHardware(); });
  }
  editGpu(g: any) { this.editingGpuId = g.id; this.gpuForm.patchValue(g); }
  deleteGpu(id: number) { this.deleteCpu(id); }

  // STORAGE
  loadStorage() { this.http.get<any[]>(this.STORAGE_API).subscribe(res => this.storageList = res); }
  saveStorage() {
    const req = this.editingStorageId ? this.http.patch(`${this.STORAGE_API}${this.editingStorageId}/`, this.storageForm.value) : this.http.post(this.STORAGE_API, this.storageForm.value);
    req.subscribe(() => { this.toast.success('Storage Saved'); this.resetStates(); this.loadStorage(); });
  }
  editStorage(s: any) { this.editingStorageId = s.id; this.storageForm.patchValue(s); }
  deleteStorage(id: number) { this.http.delete(`${this.STORAGE_API}${id}/`).subscribe(() => this.loadStorage()); }
}