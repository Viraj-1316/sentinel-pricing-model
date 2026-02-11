import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../service/auth.service';
import { environment } from '../../environments/environment'; 
import { ToasterService } from '../service/toaster.service';
export interface Quotation {
  id: number;
  cammera: number;

  cpu: any;
  gpu: any;
  ai_features: any[];

  cpu_cost: number;
  gpu_cost: number;
  ai_cost: number;

  storage_used_user: number | null;
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
 
  quotationId!: number;
  quotationData: any = null;
  quotations: Quotation[] = [];
  recent: Quotation[] = [];
 
  totalQuotations = 0;
  latestTotal: number | null = null;
  lastActivity: string | null = null;
 
  notifications: { title: string; message: string; time: string }[] = [];

  // API Endpoints
  private QUOTATION_API = `${environment.apiBaseUrl}/pricing-Model/user-quotations/`;
  private DELETE_API = `${environment.apiBaseUrl}/pricing-Model/Pricingcalculation/`;
  private PDF_API = `${environment.apiBaseUrl}/pricing-Model/quotation/`;

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService,
    private toast: ToasterService
  ) {}
 
  ngOnInit(): void {
    this.loadDashboard();
  }

  /**
   * Fetches data from the backend and normalizes hardware names for display
   */
  loadDashboard(): void {
    this.loading = true;
    this.errorMsg = null;

    this.http.get<any[]>(this.QUOTATION_API).subscribe({
      next: (res) => {
        this.quotations = (res ?? []).map(q => ({
          ...q,
          cpuName: q.cpu?.core_hardware ?? q.cpu?.name ?? q.cpu?.CPU ?? '—',
          gpuName: q.gpu?.AI_Component ?? q.gpu?.name ?? q.gpu?.GPU ?? '—',
          aiFeatureNames: Array.isArray(q.ai_features) && q.ai_features.length > 0
            ? q.ai_features.map((a: any) => a.AI_feature ?? a.name ?? '—').join(', ')
            : '—',
          storage_used_user: q.storage_used_user ?? null
        }));

        this.totalQuotations = this.quotations.length;
        this.recent = this.quotations.slice(0, 5); // Display latest 5 entries

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

  // ========================= ACTION METHODS =========================

  /**
   * Navigates back to the quotation summary form for editing flags
   */
  editQuotation(id: number): void {
    this.router.navigate(['/qoutation-form', id]);
  }

  /**
   * Deletes a quotation from the backend and updates local arrays instantly
   */
  deleteQuotation(id: number): void {
  if (confirm('Are you sure you want to permanently delete this quotation?')) {
    this.http.delete(`${this.DELETE_API}${id}/`).subscribe({
      next: () => {
        // 1. Alert the user
        alert('Quotation deleted successfully.');
        this.loadDashboard();
      },
      error: (err) => {
        console.error('Delete error:', err);
        this.errorMsg = 'Failed to delete quotation.';
      }
    });
  }
}
  /**
   * Opens the backend PDF view in a new browser tab
   */
 downloadPdf(q: any) {
  if (!q?.id) return;

  const id = q.id;
  const url = `${environment.apiBaseUrl}/pricing-Model/quotation/${id}/pdf/`;

  this.toast.info(`Downloading PDF #${id}...`);

  this.http.get(url, { responseType: 'blob' }).subscribe({
    next: (blob) => {
      console.log('download clicked');

      const file = new Blob([blob], { type: 'application/pdf' });
      const downloadURL = URL.createObjectURL(file);

      const a = document.createElement('a');
      a.href = downloadURL;
      a.download = `quotation_${id}.pdf`;
      a.click();

      URL.revokeObjectURL(downloadURL);
      this.toast.success(`PDF downloaded: #${id}`);
    },
    error: () => {
      this.toast.error('Failed to download PDF');
    }
  });
}


  // ========================= NAVIGATION HELPERS =========================

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