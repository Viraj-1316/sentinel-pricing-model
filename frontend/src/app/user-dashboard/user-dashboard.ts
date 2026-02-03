import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../service/auth.service';
 
export interface Quotation {
  id: number;
  cammera: number;

  cpu: any;
  gpu: any;
  ai_features: any[];

  cpu_cost: number;
  gpu_cost: number;
  ai_cost: number;

  storage_used_user: number | null;   // 🔥 allow null
  storage_cost: number;

  total_costing: number;
  created_at: string;

  // UI-only normalized fields
  cpuName: string;
  gpuName: string;
  aiFeatureNames: string;
}
 
@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, HttpClientModule],
  templateUrl: './user-dashboard.html',
})
export class UserDashboard implements OnInit {
  loading = true;
  errorMsg: string | null = null;
 
  quotations: Quotation[] = [];
  recent: Quotation[] = [];
 
  totalQuotations = 0;
  latestTotal: number | null = null;
  lastActivity: string | null = null;
 
  notifications: { title: string; message: string; time: string }[] = [];

  private QUOTATION_API =
    'http://127.0.0.1:8001/pricing-Model/user-quotations/';

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService
  ) {}
 
  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.errorMsg = null;

    this.http.get<any[]>(this.QUOTATION_API).subscribe({
      next: (res) => {

        this.quotations = (res ?? []).map(q => ({
          ...q,

          // ✅ CPU name extraction (handles all backend shapes)
          cpuName:
            q.cpu?.name ??
            q.cpu?.core_hardware ??
            q.cpu?.CPU ??
            '—',
          // ✅ GPU name extraction
          gpuName:
            q.gpu?.name ??
            q.gpu?.AI_Component ??
            q.gpu?.GPU ??
            '—',
          // ✅ AI features (ManyToMany)
          aiFeatureNames: Array.isArray(q.ai_features) && q.ai_features.length > 0
            ? q.ai_features
                .map((a: any) => a.AI_feature ?? a.name ?? '—')
                .join(', ')
            : '—',
          // ✅ STORAGE FIX (do NOT force 0)
          storage_used_user:
            q.storage_used_user === null || q.storage_used_user === undefined
              ? null
              : q.storage_used_user
        }));

        this.totalQuotations = this.quotations.length;
        this.recent = this.quotations.slice(0, 5);

        if (this.totalQuotations > 0) {
          const latest = this.quotations[0];
          this.latestTotal = latest.total_costing;
          this.lastActivity = latest.created_at;
        } else {
          this.latestTotal = null;
          this.lastActivity = null;
        }
        this.notifications = this.recent.map(q => ({
          title: 'Quotation Generated',
          message: `Quotation #${q.id} generated (₹${q.total_costing})`,
          time: new Date(q.created_at).toLocaleString(),
        }));
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = err?.error?.detail || 'Failed to load dashboard.';
        this.loading = false;
      },
    });
  }
  goToGenerate(): void {
    this.router.navigateByUrl('/user-requirements');
  }
 
  goToQuotations(): void {
    this.router.navigateByUrl('/quotations');
  }
  onLogout(): void {
    this.auth.logout();
  }
}
 