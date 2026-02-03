import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ToasterService } from '../service/toaster.service';

type TabKey = 'category' | 'ai' | 'hardware' | 'storage' | 'licence';
type HardwareTab = 'cpu' | 'gpu';

@Component({
  selector: 'app-pricelist',
  standalone: true,
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule],
  templateUrl: './pricelist.html',
})
export class Pricelist implements OnInit {
  // Navigation State
  tab: TabKey = 'category';
  hardwareTab: HardwareTab = 'cpu';

  // Data Lists
  categoryList: any[] = [];
  aiList: any[] = [];
  cpuList: any[] = [];
  gpuList: any[] = [];
  storageList: any[] = [];
  licenceList: any[] = [];

  // Edit Trackers
  editingCategoryId: number | null = null;
  editingAiId: number | null = null;
  editingCpuId: number | null = null;
  editingGpuId: number | null = null;
  editingStorageId: number | null = null;
  editingLicenceId: number | null = null;

  // API Endpoints
  private BASE_URL = 'http://127.0.0.1:8001/pricing-Model';
  private API = {
    category: `${this.BASE_URL}/create-category/`,
    ai: `${this.BASE_URL}/ai-feature/`,
    hardware: `${this.BASE_URL}/cameraPricing/`,
    storage: `${this.BASE_URL}/storage-costing/`,
    licence: `${this.BASE_URL}/processorUnit/`
  };

  // Forms
  categoryForm: FormGroup;
  aiForm: FormGroup;
  cpuForm: FormGroup;
  gpuForm: FormGroup;
  storageForm: FormGroup;
  licenceForm: FormGroup;

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

    this.licenceForm = this.fb.group({
    Duration: ['', Validators.required], // Matches 'Duration' in Serializer
    costing: [0, [Validators.required, Validators.min(0)]] // Matches 'costing'
  });
  
  }

  ngOnInit(): void { this.loadCurrentTab(); }

  setTab(tab: TabKey) { this.tab = tab; this.resetStates(); this.loadCurrentTab(); }
  setHardwareTab(tab: HardwareTab) { this.hardwareTab = tab; this.resetStates(); }

  resetStates() {
    this.editingCategoryId = this.editingAiId = this.editingCpuId = this.editingGpuId = this.editingStorageId = this.editingLicenceId = null;
    this.categoryForm.reset();
    this.aiForm.reset({costing: 0});
    this.cpuForm.reset({min_cammera: 1, CPUcores: 1, ram_required: 1, costing: 0});
    this.gpuForm.reset({min_cammeraA: 1, costing: 0});
    this.storageForm.reset({storage_per_cam: 0, storage_perDay: 0, costing: 0});
    this.licenceForm.reset({costing: 0});
  }

  loadCurrentTab() {
    if (this.tab === 'category') this.loadCategories();
    else if (this.tab === 'ai') this.loadAi();
    else if (this.tab === 'hardware') this.loadHardware();
    else if (this.tab === 'storage') this.loadStorage();
    else if (this.tab === 'licence') this.loadLicence();
  }

  private save(api: string, id: number | null, data: any, refreshFn: () => void, msg: string) {
    const req = id ? this.http.patch(`${api}${id}/`, data) : this.http.post(api, data);
    req.subscribe(() => { this.toast.success(msg); this.resetStates(); refreshFn(); });
  }

  // CATEGORY
  loadCategories() { this.http.get<any[]>(this.API.category).subscribe(res => this.categoryList = res); }
  saveCategory() { this.save(this.API.category, this.editingCategoryId, this.categoryForm.value, () => this.loadCategories(), 'Category Saved'); }
  editCategory(c: any) { this.editingCategoryId = c.id; this.categoryForm.patchValue(c); }
  deleteCategory(id: number) { this.http.delete(`${this.API.category}${id}/`).subscribe(() => this.loadCategories()); }

  // AI
  loadAi() { this.http.get<any[]>(this.API.ai).subscribe(res => this.aiList = res); }
  saveAi() { this.save(this.API.ai, this.editingAiId, this.aiForm.value, () => this.loadAi(), 'AI Feature Saved'); }
  editAi(a: any) { this.editingAiId = a.id; this.aiForm.patchValue(a); }
  deleteAi(id: number) { this.http.delete(`${this.API.ai}${id}/`).subscribe(() => this.loadAi()); }

  // HARDWARE (Standard & AI Enhanced)
  loadHardware() {
    this.http.get<any[]>(this.API.hardware).subscribe(res => {
      this.cpuList = res.filter(x => x.core_hardware);
      this.gpuList = res.filter(x => x.AI_Component);
    });
  }
  saveCpu() { this.save(this.API.hardware, this.editingCpuId, this.cpuForm.value, () => this.loadHardware(), 'CPU Config Saved'); }
  saveGpu() { this.save(this.API.hardware, this.editingGpuId, this.gpuForm.value, () => this.loadHardware(), 'GPU Config Saved'); }
  editCpu(c: any) { this.editingCpuId = c.id; this.cpuForm.patchValue(c); }
  editGpu(g: any) { this.editingGpuId = g.id; this.gpuForm.patchValue(g); }
  deleteCpu(id: number) { this.http.delete(`${this.API.hardware}${id}/`).subscribe(() => this.loadHardware()); }
  // THIS WAS MISSING:
  deleteGpu(id: number) { this.deleteCpu(id); }

  // STORAGE
  loadStorage() { this.http.get<any[]>(this.API.storage).subscribe(res => this.storageList = res); }
  saveStorage() { this.save(this.API.storage, this.editingStorageId, this.storageForm.value, () => this.loadStorage(), 'Storage Saved'); }
  editStorage(s: any) { this.editingStorageId = s.id; this.storageForm.patchValue(s); }
  deleteStorage(id: number) { this.http.delete(`${this.API.storage}${id}/`).subscribe(() => this.loadStorage()); }

  // LICENCE
  // Load Licences
loadLicence() {
  this.http.get<any[]>(this.API.licence).subscribe(res => {
    this.licenceList = res;
  });
}

// Save or Update Licence
saveLicence() {
  const data = this.licenceForm.value;
  const req = this.editingLicenceId 
    ? this.http.patch(`${this.API.licence}${this.editingLicenceId}/`, data)
    : this.http.post(this.API.licence, data);

  req.subscribe(() => {
    this.toast.success('Licence saved successfully');
    this.resetStates();
    this.loadLicence();
  });
}

// Edit Licence
editLicence(l: any) {
  this.editingLicenceId = l.id;
  this.licenceForm.patchValue({
    Duration: l.Duration,
    costing: l.costing
  });
}
  deleteLicence(id: number) { this.http.delete(`${this.API.licence}${id}/`).subscribe(() => this.loadLicence()); }
}