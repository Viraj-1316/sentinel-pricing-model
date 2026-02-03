import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { ConfirmdialogService } from '../service/confirmdialog.service';

type ActiveSection = 'users' | 'quotations' | 'logs' | null;

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role?: string;
  phone_number?: string;
  date_joined?: string;
}

interface AdminQuotation {
  id: number;
  username?: string; // ✅ backend sends username
  cammera: number;
  ai_cost: number;
  total_costing: number;
  created_at: string;
}

interface AuditLog {
  id: number;
  action: string;
  username?: string;
  created_at: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboard implements OnInit {

  // ✅ API Endpoints
  USERS_API = 'http://127.0.0.1:8001/pricing-Model/admin/users/';
  QUOTATIONS_API = 'http://127.0.0.1:8001/pricing-Model/admin/quotations/';
  LOGS_API = 'http://127.0.0.1:8001/pricing-Model/admin/audit-logs/';

  // counts
  totalUsers = 0;
  totalQuotations = 0;
  logsCount = 0;
  quotationPreviewLimit = 6;
  showViewAllQuotations = false;

  // UI state
  activeSection: ActiveSection = null;
  loadingSection = false;
  errorMsg: string | null = null;

  // lists
  users: AdminUser[] = [];
  quotations: AdminQuotation[] = [];
  logs: AuditLog[] = [];

  constructor(private http: HttpClient, private confirm: ConfirmdialogService) {}

  ngOnInit(): void {
    this.loadCounts();
  }

  loadCounts() {
    this.http.get<AdminUser[]>(this.USERS_API).subscribe({
      next: (res) => this.totalUsers = (res || []).length,
      error: () => {}
    });

    this.http.get<AdminQuotation[]>(this.QUOTATIONS_API).subscribe({
      next: (res) => this.totalQuotations = (res || []).length,
      error: () => {}
    });

    this.http.get<AuditLog[]>(this.LOGS_API).subscribe({
      next: (res) => this.logsCount = (res || []).length,
      error: () => {}
    });
  }

  openSection(section: ActiveSection) {
    if (this.activeSection === section) {
      this.activeSection = null;
      return;
    }

    this.activeSection = section;
    this.errorMsg = null;
    this.loadActiveSectionData();
  }

  loadActiveSectionData() {
  if (!this.activeSection) return;

  this.loadingSection = true;
  this.errorMsg = null;

  const apiMap: Record<string, string> = {
    users: this.USERS_API,
    quotations: this.QUOTATIONS_API,
    logs: this.LOGS_API,
  };

  this.http.get<any[]>(apiMap[this.activeSection]).subscribe({
    next: (res) => {
      this.loadingSection = false;

      if (this.activeSection === 'users') this.users = res || [];

      if (this.activeSection === 'quotations') {
        const all = res || [];
        this.showViewAllQuotations = all.length > this.quotationPreviewLimit;

        // ✅ only show first 8
        this.quotations = all.slice(0, this.quotationPreviewLimit);
      }

      if (this.activeSection === 'logs') this.logs = res || [];
    },
    error: (err) => {
      this.loadingSection = false;
      this.errorMsg = err?.error?.detail || 'Failed to load data.';
    }
  });
}


  badgeTitle(): string {
    if (this.activeSection === 'users') return 'Users';
    if (this.activeSection === 'quotations') return 'All Quotations';
    if (this.activeSection === 'logs') return 'Audit Logs';
    return '';
  }

  trackById(_: number, item: any) {
    return item.id;
  }
}
