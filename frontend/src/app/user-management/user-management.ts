import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ToasterService } from '../service/toaster.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

type RoleFilter = 'all' | 'admin' | 'user';
type SortBy = 'latest' | 'oldest' | 'name';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_active?: boolean;
  date_joined?: string;
  last_login?: string;
  role?: string;
  phone_number?: string;
}

interface AdminQuotation {
  id: number;
  username?: string;
  cammera: number;
  ai_cost: number;
  total_costing: number;
  created_at: string;
}

interface UserStats {
  quotations: number;
  revenue: number;
  lastQuotationAt?: string | null;
}

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css',
})
export class UserManagement implements OnInit {

  USERS_API = `${environment.apiBaseUrl}/pricing-Model/admin/users/`;
  QUOTATIONS_API = `${environment.apiBaseUrl}/pricing-Model/admin/quotations/`;

  loading = false;
  errorMsg: string | null = null;

  users: AdminUser[] = [];
  filtered: AdminUser[] = [];
  quotations: AdminQuotation[] = [];

  statsByUsername = new Map<string, UserStats>();

  totalUsers = 0;
  totalAdmins = 0;
  activeUsers = 0;
  newUsers7d = 0;

  // Filters
  search = '';
  roleFilter: RoleFilter = 'all';
  sortBy: SortBy = 'latest';

  // Drawer
  showDrawer = false;
  selectedUser: AdminUser | null = null;
  selectedStats: UserStats | null = null;
  selectedRecentQuotes: AdminQuotation[] = [];

  // ✅ Pagination State
  pageSize = 2;
  currentPage = 1;
  totalPages = 10;
  pageRows: AdminUser[] = [];

  constructor(
    private http: HttpClient,
    private toast: ToasterService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  // ===============================
  // Load Users + Quotations
  // ===============================

  loadAll() {
    this.loading = true;
    this.errorMsg = null;

    this.http.get<AdminUser[]>(this.USERS_API).subscribe({
      next: (res) => {
        this.users = res || [];

        this.totalUsers = this.users.length;
        this.totalAdmins = this.users.filter(u => !!u.is_staff).length;
        this.activeUsers = this.users.filter(u => u.is_active !== false).length;

        const now = new Date();
        this.newUsers7d = this.users.filter(u => {
          if (!u.date_joined) return false;
          const joined = new Date(u.date_joined);
          const diff =
            (now.getTime() - joined.getTime()) / (1000 * 60 * 60 * 24);
          return diff <= 7;
        }).length;

        this.loadQuotations();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.detail || 'Failed to load users.';
      },
    });
  }

  loadQuotations() {
    this.http.get<AdminQuotation[]>(this.QUOTATIONS_API).subscribe({
      next: (res) => {
        this.quotations = res || [];
        this.buildStatsMap();
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Quotations stats failed to load.');
        this.applyFilters();
      },
    });
  }

  // ===============================
  // Build Stats
  // ===============================

  buildStatsMap() {
    this.statsByUsername.clear();

    for (const q of this.quotations) {
      const uname = (q.username || '').trim();
      if (!uname) continue;

      if (!this.statsByUsername.has(uname)) {
        this.statsByUsername.set(uname, {
          quotations: 0,
          revenue: 0,
          lastQuotationAt: null,
        });
      }

      const st = this.statsByUsername.get(uname)!;
      st.quotations += 1;
      st.revenue += Number(q.total_costing || 0);

      const created = q.created_at
        ? new Date(q.created_at).toISOString()
        : null;

      if (!st.lastQuotationAt || (created && created > st.lastQuotationAt)) {
        st.lastQuotationAt = created;
      }
    }
  }

  // ===============================
  // Filters + Sorting
  // ===============================

  applyFilters() {
    let list = [...this.users];

    const q = this.search.trim().toLowerCase();

    if (q) {
      list = list.filter(u =>
        (u.username || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone_number || '').toLowerCase().includes(q)
      );
    }

    if (this.roleFilter === 'admin') {
      list = list.filter(u => !!u.is_staff);
    } else if (this.roleFilter === 'user') {
      list = list.filter(u => !u.is_staff);
    }

    if (this.sortBy === 'latest') {
      list.sort((a, b) =>
        new Date(b.date_joined || 0).getTime() -
        new Date(a.date_joined || 0).getTime()
      );
    } else if (this.sortBy === 'oldest') {
      list.sort((a, b) =>
        new Date(a.date_joined || 0).getTime() -
        new Date(b.date_joined || 0).getTime()
      );
    } else {
      list.sort((a, b) =>
        (a.username || '').localeCompare(b.username || '')
      );
    }

    this.filtered = list;

    // ✅ Recalculate pages
    this.totalPages = Math.max(
      1,
      Math.ceil(this.filtered.length / this.pageSize)
    );

    this.currentPage = 1;
    this.updatePage();
  }

  // ===============================
  // Pagination Logic
  // ===============================

  updatePage() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.pageRows = this.filtered.slice(start, end);
  }

  nextPage() {
    if (this.currentPage >= this.totalPages) return;
    this.currentPage++;
    this.updatePage();
  }

  prevPage() {
    if (this.currentPage <= 1) return;
    this.currentPage--;
    this.updatePage();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePage();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // ===============================
  // Drawer Logic
  // ===============================

  openUser(user: AdminUser) {
    this.selectedUser = user;

    const uname = (user.username || '').trim();

    this.selectedStats =
      uname
        ? this.statsByUsername.get(uname) ||
          { quotations: 0, revenue: 0, lastQuotationAt: null }
        : null;

    this.selectedRecentQuotes = this.quotations
      .filter(q => (q.username || '').trim() === uname)
      .slice(0, 5);

    this.showDrawer = true;
  }

  closeDrawer() {
    this.showDrawer = false;
    this.selectedUser = null;
    this.selectedStats = null;
    this.selectedRecentQuotes = [];
  }

  // ===============================
  // Actions
  // ===============================

  toggleAdmin(user: AdminUser) {
    this.http.post(
      `${environment.apiBaseUrl}/pricing-Model/admin/users/${user.id}/toggle-role/`,
      {}
    ).subscribe({
      next: (res: any) => {
        user.is_staff = res.is_staff;
        this.toast.success(res.detail);
      },
      error: (err) => {
        this.toast.error(err?.error?.detail || 'Role change failed');
      }
    });
  }

  toggleActive(user: AdminUser) {
    this.http.post(
      `${environment.apiBaseUrl}/pricing-Model/admin/users/${user.id}/toggle-status/`,
      {}
    ).subscribe({
      next: (res: any) => {
        user.is_active = res.is_active;
        this.toast.success(res.detail);
      },
      error: (err) => {
        this.toast.error(err?.error?.detail || 'Status change failed');
      }
    });
  }

  refresh() {
    this.toast.info('Refreshing users...');
    this.closeDrawer();
    this.loadAll();
  }

  viewUserQuotations(u: AdminUser) {
    if (!u?.username) return;

    this.router.navigate(['/quotations'], {
      queryParams: { user: u.username }
    });
  }

  getRoleLabel(u: AdminUser): string {
    return u.is_staff ? 'Admin' : 'User';
  }

  getRoleBadgeClass(u: AdminUser): string {
    return u.is_staff ? 'text-bg-danger' : 'text-bg-primary';
  }

  getUserStats(u: AdminUser): UserStats {
    const st = this.statsByUsername.get((u.username || '').trim());
    return st || { quotations: 0, revenue: 0, lastQuotationAt: null };
  }

  trackById(_: number, item: any) {
    return item.id;
  }
}
