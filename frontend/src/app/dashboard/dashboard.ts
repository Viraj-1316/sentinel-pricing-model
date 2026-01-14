import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterLink } from '@angular/router';

export interface CameraPricing {
  id: number;
  cameras: number;
  processor: string;
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
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterLink],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  loading = false;
  errorMsg: string | null = null;

  // tables
  cameraList: CameraPricing[] = [];
  aiList: AIEnabled[] = [];

  // forms
  cameraForm: FormGroup;
  aiForm: FormGroup;

  private CAMERA_API = 'http://192.168.65.89:8001/api/camera-pricing/';
  private AI_API = 'http://192.168.65.89:8001/api/ai-enabled/';

  constructor(private http: HttpClient, private fb: FormBuilder) {
    // Camera form
    this.cameraForm = this.fb.group({
      cameras: ['', [Validators.required, Validators.min(1)]],
      processor: ['', [Validators.required, Validators.minLength(2)]],
      total_costing: ['', [Validators.required, Validators.min(0)]],
    });

    // AI feature form
    this.aiForm = this.fb.group({
      AI_feature: ['', [Validators.required, Validators.minLength(2)]],
      costing: ['', [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.fetchAll();
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

    if (this.cameraForm.invalid) {
      this.cameraForm.markAllAsTouched();
      return;
    }

    const payload = {
      cameras: Number(this.cameraForm.value.cameras),
      processor: this.cameraForm.value.processor,
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
