import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../service/auth.service';
import {RouterLink} from '@angular/router';
import { ConfirmdialogService } from '../service/confirmdialog.service';
import { ToasterService } from '../service/toaster.service';
export interface CameraPricing {
  id: number;
  min_cammera: number;
  max_cammera: number | null;
  Processor: string;
  total_costing: number;
}

export interface AIEnabled {
  id: number;
  AI_feature: string;
  costing: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule,RouterLink],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  loading = false;
  errorMsg: string | null = null;

  // ✅ permission flag
  canManage = false; // staff OR superuser can manage

  // tables
  cameraList: CameraPricing[] = [];
  aiList: AIEnabled[] = [];

  // forms
  cameraForm: FormGroup;
  aiForm: FormGroup;

  private CAMERA_API = 'http://127.0.0.1:8001/pricing-Model/cameraPricing/';
  private AI_API = 'http://127.0.0.1:8001/pricing-Model/ai-feature/';

  // ✅ add this endpoint in backend
  private ME_API = 'http://127.0.0.1:8001/accounts/api/me/';

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private auth: AuthService,
    private confirm: ConfirmdialogService,
    private toaster: ToasterService
  ) {
    this.cameraForm = this.fb.group({
      min_cammera: ['', [Validators.required, Validators.min(1)]],
      max_cammera: [''], // optional
      Processor: ['', [Validators.required, Validators.minLength(2)]],
      total_costing: ['', [Validators.required, Validators.min(0)]],
    });

    this.aiForm = this.fb.group({
      AI_feature: ['', [Validators.required, Validators.minLength(2)]],
      costing: ['', [Validators.required, Validators.min(0)]],
    });
  }

  async PromiseLogout() {
    const ok = await this.confirm.open(
      "Confirmation",
      "Are you sure you want to logout?"
    );
    if (ok){
      this.toaster.success("Logged out successfully");
   this.auth.logout();
    }
  }
  isAdmin = false;

ngOnInit() {
  const role = localStorage.getItem('role'); // ex: "admin" or "user"
  this.isAdmin = role === 'admin';
    this.fetchMe();     // ✅ permission first
    this.fetchAll(); 
}




  // ✅ permission API
  fetchMe(): void {
    this.http.get<any>(this.ME_API).subscribe({
      next: (res) => {
        // ✅ staff OR superuser => can manage
        this.canManage = !!(res?.is_staff || res?.is_superuser);
      },
      error: () => {
        this.canManage = false;
      },
    });
  }

  // ---------- shared ----------
  fetchAll(): void {
    this.fetchCameraPricing();
    this.fetchAIEnabled();
  }

  isInvalid(form: FormGroup, controlName: string): boolean {
    const c = form.get(controlName);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  // ---------- camera pricing ----------
  fetchCameraPricing(): void {
    this.loading = true;
    this.http.get<CameraPricing[]>(this.CAMERA_API).subscribe({
      next: (data) => {
        this.cameraList = data || [];
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Failed to load Camera Pricing.';
        this.loading = false;
      },
    });
  }

  onAddCameraPricing(): void {
    this.errorMsg = null;

    // ✅ frontend protection
    if (!this.canManage) {
      this.errorMsg = 'You have view-only access.';
      return;
    }

    if (this.cameraForm.invalid) {
      this.cameraForm.markAllAsTouched();
      return;
    }

    const payload = {
      min_cammera: Number(this.cameraForm.value.min_cammera),
      max_cammera: this.cameraForm.value.max_cammera
        ? Number(this.cameraForm.value.max_cammera)
        : null,
      Processor: this.cameraForm.value.Processor,
      total_costing: Number(this.cameraForm.value.total_costing),
    };

    this.loading = true;
    this.http.post(this.CAMERA_API, payload).subscribe({
      next: () => {
        this.cameraForm.reset();
        this.fetchCameraPricing();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.detail || 'Failed to add Camera Pricing.';
      },
    });
  }

  onDeleteCamera(id: number): void {
    // ✅ frontend protection
    if (!this.canManage) {
      this.errorMsg = 'You have view-only access.';
      return;
    }

    if (!confirm('Delete this camera pricing record?')) return;

    this.loading = true;
    this.http.delete(`${this.CAMERA_API}${id}/`).subscribe({
      next: () => this.fetchCameraPricing(),
      error: () => {
        this.loading = false;
        this.errorMsg = 'Failed to delete Camera Pricing.';
      },
    });
  }

  // ---------- AI enabled ----------
  fetchAIEnabled(): void {
    this.loading = true;
    this.http.get<AIEnabled[]>(this.AI_API).subscribe({
      next: (data) => {
        this.aiList = data || [];
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Failed to load AI Enabled Features.';
        this.loading = false;
      },
    });
  }

  onAddAI(): void {
    this.errorMsg = null;

    // ✅ frontend protection
    if (!this.canManage) {
      this.errorMsg = 'You have view-only access.';
      return;
    }

    if (this.aiForm.invalid) {
      this.aiForm.markAllAsTouched();
      return;
    }

    const payload = {
      AI_feature: this.aiForm.value.AI_feature,
      costing: Number(this.aiForm.value.costing),
    };

    this.loading = true;
    this.http.post(this.AI_API, payload).subscribe({
      next: () => {
        this.aiForm.reset();
        this.fetchAIEnabled();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.detail || 'Failed to add AI Feature.';
      },
    });
  }

  onDeleteAI(id: number): void {
    // ✅ frontend protection
    if (!this.canManage) {
      this.errorMsg = 'You have view-only access.';
      return;
    }

    if (!confirm('Delete this AI feature record?')) return;

    this.loading = true;
    this.http.delete(`${this.AI_API}${id}/`).subscribe({
      next: () => this.fetchAIEnabled(),
      error: () => {
        this.loading = false;
        this.errorMsg = 'Failed to delete AI Feature.';
      },
    });
  }
}
