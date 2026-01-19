import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { ToasterService } from '../service/toaster.service';

export interface QuotationRow {
  id: number;
  cammera: number;
  camera_cost: number;
  ai_cost: number;
  total_costing: number;
  created_at: string;

  // for admin view you may also have:
  user_name?: string;
}

@Component({
  selector: 'app-quotations',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterLink],
  templateUrl: './quotations.html',
})
export class Quotations implements OnInit {
  loading = false;
  errorMsg: string | null = null;

  // role
  isAdmin = false;
  username = '';

  // data
  quotations: QuotationRow[] = [];
  filtered: QuotationRow[] = [];

  // KPI
  totalQuotations = 0;
  latestTotal: number | null = null;

  // filters
  search = '';
  sortBy: 'latest' | 'oldest' | 'high' | 'low' = 'latest';

  // pagination (frontend pagination)
  page = 1;
  pageSize = 8;
  totalPages = 1;

  // preview modal
  showPreview = false;
  previewQuotation: any = null;

  // ✅ API endpoints
  private USER_LIST_API = 'http://127.0.0.1:8001/pricing-Model/user-quotations/';
  private ADMIN_LIST_API = 'http://127.0.0.1:8001/pricing-Model/admin-quotations/'; 
  // ⬆️ You MUST have this endpoint in backend for all quotations
  // If not available now, admin will also use USER_LIST_API

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private toast: ToasterService
  ) {}

  ngOnInit(): void {
    this.loadMeThenQuotations();
  }

  // ✅ Load Me then role + quotations
  loadMeThenQuotations() {
    this.auth.getMe().subscribe({
      next: (res: any) => {
        this.username = res.username;
        this.isAdmin = res.is_staff || res.is_superuser;
        this.loadQuotations();
      },
      error: () => {
        this.isAdmin = false;
        this.loadQuotations();
      }
    });
  }

  // ✅ List quotations based on role
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
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.detail || 'Failed to load quotations.';
      }
    });
  }

  // ✅ KPI
  buildKpi() {
    this.totalQuotations = this.quotations.length;
    const latest = this.quotations?.[0];
    this.latestTotal = latest?.total_costing ?? null;
  }

  // ✅ Filter + Sort + Pagination
  applyFilters() {
    let list = [...this.quotations];

    // search by id
    if (this.search?.trim()) {
      const q = this.search.trim().toLowerCase();
      list = list.filter((x) => String(x.id).includes(q));
    }

    // sort
    if (this.sortBy === 'latest') {
      list = list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (this.sortBy === 'oldest') {
      list = list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (this.sortBy === 'high') {
      list = list.sort((a, b) => (b.total_costing || 0) - (a.total_costing || 0));
    } else if (this.sortBy === 'low') {
      list = list.sort((a, b) => (a.total_costing || 0) - (b.total_costing || 0));
    }

    this.filtered = list;

    // pagination
    this.totalPages = Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
    if (this.page > this.totalPages) this.page = this.totalPages;
  }

  get pageRows(): QuotationRow[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  goPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
  }

  onSearchChange(val: string) {
    this.search = val;
    this.page = 1;
    this.applyFilters();
  }

  onSortChange(val: any) {
    this.sortBy = val;
    this.page = 1;
    this.applyFilters();
  }

  refresh() {
    this.loadQuotations();
    this.toast.info('Refreshing quotations...');
  }

  // ✅ View Preview
  openPreview(q: any) {
    this.previewQuotation = q;
    this.showPreview = true;
  }
  closePreview() {
    this.showPreview = false;
    this.previewQuotation = null;
  }

  // ✅ Download
  downloadPdf(q: QuotationRow) {
    const url = `http://127.0.0.1:8001/pricing-Model/quotation/${q.id}/pdf/`;

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

  // ✅ Send Email
  sendEmail(q: QuotationRow) {
    const url = `http://127.0.0.1:8001/pricing-Model/quotation/${q.id}/send-email/`;

    this.toast.info(`Sending email for quotation #${q.id}...`);

    this.http.post(url, {}).subscribe({
      next: () => this.toast.success('Email sent successfully ✅'),
      error: () => this.toast.error('Failed to send email ❌'),
    });
  }

  // ✅ Admin only: Delete quotation (optional)
  deleteQuotation(q: QuotationRow) {
    if (!this.isAdmin) return;

    const url = `http://127.0.0.1:8001/pricing-Model/admin/quotation/${q.id}/delete/`;

    if (!confirm(`Delete quotation #${q.id}?`)) return;

    this.http.delete(url).subscribe({
      next: () => {
        this.toast.success(`Deleted quotation #${q.id}`);
        this.loadQuotations();
      },
      error: () => this.toast.error('Delete failed'),
    });
  }
}
