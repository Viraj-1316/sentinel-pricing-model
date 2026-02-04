import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ToasterService } from '../service/toaster.service';
import { environment } from '../../environments/environment';
type SortBy = 'latest' | 'oldest';
type ActionFilter = 'all' | 'LOGIN' | 'LOGOUT' | 'CREATE_QUOTATION' | 'DOWNLOAD_PDF' | 'SEND_EMAIL' | 'DELETE_QUOTATION' | 'UPDATE_PRICING';

export interface AuditLogRow {
  id: number;
  action: string;        // backend action key
  username?: string;     // who did it
  ip_address?: string;
  user_agent?: string;
  details?: string;      // any message
  created_at: string;
}

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './logs.html',
  styleUrl: './logs.css',
})
export class Logs implements OnInit {

  // ✅ API endpoint
  private LOGS_API = `${environment.apiBaseUrl}/pricing-Model/admin/audit-logs/`;

  loading = false;
  errorMsg: string | null = null;

  logs: AuditLogRow[] = [];
  filtered: AuditLogRow[] = [];

  // filters
  search = '';
  actionFilter: ActionFilter = 'all';
  sortBy: SortBy = 'latest';

  // pagination
  page = 1;
  pageSize = 10;
  totalPages = 1;

  // modal
  showModal = false;
  selectedLog: AuditLogRow | null = null;

  constructor(private http: HttpClient, private toast: ToasterService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs() {
    this.loading = true;
    this.errorMsg = null;

    this.http.get<AuditLogRow[]>(this.LOGS_API).subscribe({
      next: (res) => {
        this.loading = false;
        this.logs = res || [];
        this.applyFilters();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.detail || 'Failed to load audit logs.';
      },
    });
  }

  refresh() {
    this.toast.info('Refreshing logs...');
    this.loadLogs();
  }

  // ✅ apply filters
  applyFilters() {
    let list = [...this.logs];

    // search by id, username, action
    if (this.search.trim()) {
      const q = this.search.trim().toLowerCase();
      list = list.filter((x) => {
        const idMatch = String(x.id).includes(q);
        const userMatch = (x.username || '').toLowerCase().includes(q);
        const actionMatch = (x.action || '').toLowerCase().includes(q);
        const detailsMatch = (x.details || '').toLowerCase().includes(q);
        return idMatch || userMatch || actionMatch || detailsMatch;
      });
    }

    // action filter
    if (this.actionFilter !== 'all') {
      list = list.filter((x) => (x.action || '') === this.actionFilter);
    }

    // sorting
    if (this.sortBy === 'latest') {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    this.filtered = list;

    // pagination
    this.totalPages = Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
    this.page = Math.min(this.page, this.totalPages);
  }

  // pagination helpers
  get pageRows(): AuditLogRow[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  goPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
  }

  onSearch(val: string) {
    this.search = val;
    this.page = 1;
    this.applyFilters();
  }

  // ✅ UI label mapping
  actionLabel(key: string): string {
    const map: Record<string, string> = {
      LOGIN: 'Login',
      LOGOUT: 'Logout',
      CREATE_QUOTATION: 'Quotation Created',
      DOWNLOAD_PDF: 'PDF Downloaded',
      SEND_EMAIL: 'Quotation Email Sent',
      DELETE_QUOTATION: 'Quotation Deleted',
      UPDATE_PRICING: 'Pricing Updated',
    };

    return map[key] || key;
  }

  // ✅ modal
  openLog(log: AuditLogRow) {
    this.selectedLog = log;
    this.showModal = true;
  }

  closeModal() {
    this.selectedLog = null;
    this.showModal = false;
  }

  trackById(_: number, item: AuditLogRow) {
    return item.id;
  }
}
