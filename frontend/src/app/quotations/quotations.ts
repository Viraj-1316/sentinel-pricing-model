import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { ToasterService } from '../service/toaster.service';
import { ConfirmdialogService } from '../service/confirmdialog.service';
import { environment } from '../../environments/environment';
export interface QuotationRow {
  id: number;
  cammera: number;
  camera_cost: number;
  ai_cost: number;
  total_costing: number;
  created_at: string;
  cpu_cost: number;
  gpu_cost: number;
  storage_cost: number;
  ai_features: AiFeature[];
  // admin fields
  username?: string;
  email?: string;
}
export interface AiFeature {
  id: number;
  AI_feature: string;
  costing: number;
}

@Component({
  selector: 'app-quotations',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterLink],
  templateUrl: './quotations.html',
  styleUrl: './quotations.css',
})
export class Quotations implements OnInit {
  loading = false;
  loadingMore = false;
  errorMsg: string | null = null;

  // role
  isAdmin = false;
  username = '';

  // data
  quotations: QuotationRow[] = [];
  filtered: QuotationRow[] = [];

  // ✅ infinite scroll
  pageSize = 20;
  visibleCount = 20;
  visibleRows: QuotationRow[] = [];
  hasMore = true;

  // KPI
  totalQuotations = 0;
  latestTotal: number | null = null;

  // filters
  search = '';
  sortBy: 'latest' | 'oldest' | 'high' | 'low' = 'latest';

  // preview modal
  showPreview = false;
  previewQuotation: QuotationRow | null = null;

  // ✅ APIs
  private USER_LIST_API = `${environment.apiBaseUrl}/pricing-Model/user-quotations/`;
  private ADMIN_LIST_API = `${environment.apiBaseUrl}/pricing-Model/admin/quotations/`;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private toast: ToasterService,
    private confirm: ConfirmdialogService
  ) {}

  ngOnInit(): void {
    this.loadMeThenQuotations();
  }

  // ✅ Load user role then load quotations
  loadMeThenQuotations() {
    this.auth.getMe().subscribe({
      next: (res: any) => {
        this.username = res?.username || '';
        this.isAdmin = !!(res?.is_staff || res?.is_superuser);
        this.loadQuotations();
      },
      error: () => {
        this.isAdmin = false;
        this.loadQuotations();
      },
    });
  }

  // ✅ Fetch quotations
  loadQuotations() {
    this.loading = true;
    this.errorMsg = null;

    const api = this.isAdmin ? this.ADMIN_LIST_API : this.USER_LIST_API;

    this.http.get<QuotationRow[]>(api).subscribe({
      next: (data) => {
        this.loading = false;

        this.quotations = data || [];
        this.applyFilters();
        this.buildKpi();

        // ✅ reset infinite scroll
        this.visibleCount = this.pageSize;
        this.applyInfiniteScroll();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.detail || 'Failed to load quotations.';
      },
    });
  }

  buildKpi() {
    this.totalQuotations = this.quotations.length;
    const latest = this.quotations?.[0];
    this.latestTotal = latest?.total_costing ?? null;
  }

  applyFilters() {
  let list = [...this.quotations];

  // ✅ Search (ID + Username + Cameras + Total)
  if (this.search?.trim()) {
    const q = this.search.trim().toLowerCase();

    list = list.filter((x) => {
      const idMatch = String(x.id).toLowerCase().includes(q);
      const cameraMatch = String(x.cammera).toLowerCase().includes(q);
      const totalMatch = String(x.total_costing).toLowerCase().includes(q);

      // ✅ username search only if Admin
      const userMatch = this.isAdmin
        ? (x.username || '').toLowerCase().includes(q)
        : false;

      return idMatch || cameraMatch || totalMatch || userMatch;
    });
  }

  // ✅ Sort
  if (this.sortBy === 'latest') {
    list.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } else if (this.sortBy === 'oldest') {
    list.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  } else if (this.sortBy === 'high') {
    list.sort((a, b) => (b.total_costing || 0) - (a.total_costing || 0));
  } else if (this.sortBy === 'low') {
    list.sort((a, b) => (a.total_costing || 0) - (b.total_costing || 0));
  }

  // ✅ Final
  this.filtered = list;
}


  // ✅ infinite scroll apply
  applyInfiniteScroll(): void {
    const total = this.filtered.length;
    this.visibleRows = this.filtered.slice(0, this.visibleCount);
    this.hasMore = this.visibleCount < total;
  }

  // ✅ infinite scroll handler
  onScroll(event: Event): void {
    const el = event.target as HTMLElement;

    const nearBottom =
      el.scrollTop + el.clientHeight >= el.scrollHeight - 120;

    if (!nearBottom || !this.hasMore || this.loadingMore) return;

    this.loadingMore = true;

    setTimeout(() => {
      this.visibleCount += this.pageSize;
      this.applyInfiniteScroll();
      this.loadingMore = false;
    }, 200);
  }

  onSearchChange(val: string) {
    this.search = val;
    this.applyFilters();

    this.visibleCount = this.pageSize;
    this.applyInfiniteScroll();
  }

  onSortChange(val: any) {
    this.sortBy = val;
    this.applyFilters();

    this.visibleCount = this.pageSize;
    this.applyInfiniteScroll();
  }

  refresh() {
    this.loadQuotations();
    this.toast.info('Refreshing quotations...');
  }

  // ✅ Preview
  openPreview(q: QuotationRow) {
    this.previewQuotation = q;
    this.showPreview = true;
  }

  closePreview() {
    this.showPreview = false;
    this.previewQuotation = null;
  }

  // ✅ Download (NULL SAFE ✅ FIXED)
  downloadPdf(q: QuotationRow | null) {
    if (!q) return;

    const url = `${environment.apiBaseUrl}/pricing-Model/quotation/${q.id}/pdf/`;

    this.toast.info(`Downloading PDF #${q.id}...`);

    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const file = new Blob([blob], { type: 'application/pdf' });
        const downloadURL = window.URL.createObjectURL(file);

        const a = document.createElement('a');
        a.href = downloadURL;
        a.download = `quotation_${q.id}.pdf`;
        a.click();

        window.URL.revokeObjectURL(downloadURL);
        this.toast.success(`PDF downloaded: #${q.id}`);
      },
      error: () => {
        this.toast.error('Failed to download PDF');
      },
    });
  }

  // ✅ Email (NULL SAFE ✅ FIXED)
  sendEmail(q: QuotationRow | null) {
    if (!q) return;

    const url = `${environment.apiBaseUrl}/pricing-Model/quotation/${q.id}/send-email/`;

    this.toast.info(`Sending email for quotation #${q.id}...`);

    this.http.post(url, {}).subscribe({
      next: () => this.toast.success('Email sent successfully ✅'),
      error: () => this.toast.error('Failed to send email ❌'),
    });
  }

  // ✅ Admin Delete (NULL SAFE)
  async deleteQuotation(q: QuotationRow | null) {
  if (!this.isAdmin || !q) return;
 
  const url =
    `${environment.apiBaseUrl}/pricing-Model/admin/quotations/${q.id}/`;
 
  const ok = await this.confirm.open(
    "Confirmation",
    "Are you sure you want to logout?"
  );
  if(ok){
  this.http.delete(url).subscribe({
    next: () => {
      this.toast.success(`Deleted quotation #${q.id}`);
      this.loadQuotations();
    },
    error: () => this.toast.error('Delete failed'),
  });
}
   }
  trackById(_: number, row: QuotationRow) {
    return row.id;
  }
}
