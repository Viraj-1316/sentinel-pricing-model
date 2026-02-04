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

  // UI filters
  search = '';
  roleFilter: RoleFilter = 'all';
  sortBy: SortBy = 'latest';

  // drawer
  showDrawer = false;
  selectedUser: AdminUser | null = null;
  selectedStats: UserStats | null = null;
  selectedRecentQuotes: AdminQuotation[] = [];

  // ✅ Pagination
  page = 1;
  pageSize = 4;
  totalPages = 1;

  constructor(private http: HttpClient, private toast: ToasterService, private router: Router) {}

  ngOnInit(): void {
    this.loadAll();
  }
viewUserQuotations(u: AdminUser) {
  if (!u?.username) return;

  // ✅ redirect with username filter
  this.router.navigate(['/quotations'], {
    queryParams: { user: u.username }
  });
}

  loadAll() {
    this.loading = true;
    this.errorMsg = null;

    this.http.get<AdminUser[]>(this.USERS_API).subscribe({
      next: (res) => {
        this.users = res || [];
        this.totalUsers = this.users.length;
        this.totalAdmins = this.users.filter((u) => !!u.is_staff).length;
        this.activeUsers = this.users.filter((u) => u.is_active !== false).length;

        const now = new Date();
        this.newUsers7d = this.users.filter((u) => {
          if (!u.date_joined) return false;
          const joined = new Date(u.date_joined);
          const diff = (now.getTime() - joined.getTime()) / (1000 * 60 * 60 * 24);
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

      const created = q.created_at ? new Date(q.created_at).toISOString() : null;
      if (!st.lastQuotationAt || (created && created > st.lastQuotationAt)) {
        st.lastQuotationAt = created;
      }
    }
  }

  // ✅ Filters + sorting + pagination reset
  applyFilters() {
    let list = [...this.users];

    const q = this.search.trim().toLowerCase();
    if (q) {
      list = list.filter((u) => {
        const uname = (u.username || '').toLowerCase().includes(q);
        const email = (u.email || '').toLowerCase().includes(q);
        const phone = (u.phone_number || '').toLowerCase().includes(q);
        return uname || email || phone;
      });
    }

    if (this.roleFilter === 'admin') {
      list = list.filter((u) => !!u.is_staff);
    } else if (this.roleFilter === 'user') {
      list = list.filter((u) => !u.is_staff);
    }

    if (this.sortBy === 'latest') {
      list.sort((a, b) => new Date(b.date_joined || 0).getTime() - new Date(a.date_joined || 0).getTime());
    } else if (this.sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.date_joined || 0).getTime() - new Date(b.date_joined || 0).getTime());
    } else if (this.sortBy === 'name') {
      list.sort((a, b) => (a.username || '').localeCompare(b.username || ''));
    }

    this.filtered = list;

    // ✅ pagination calculations
    this.totalPages = Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
    this.page = 1; // ✅ reset page always after applying filters
  }

  // ✅ only 5 users shown
  get pageRows(): AdminUser[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  goPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
  }

  // ✅ Row click -> open drawer
  openUser(user: AdminUser) {
    this.selectedUser = user;

    const uname = (user.username || '').trim();
    this.selectedStats =
      uname
        ? this.statsByUsername.get(uname) || { quotations: 0, revenue: 0, lastQuotationAt: null }
        : null;

    this.selectedRecentQuotes = this.quotations
      .filter((q) => (q.username || '').trim() === uname)
      .slice(0, 5);

    this.showDrawer = true;
  }

  closeDrawer() {
    this.showDrawer = false;
    this.selectedUser = null;
    this.selectedStats = null;
    this.selectedRecentQuotes = [];
  }

  toggleAdmin(user: AdminUser) {
    this.toast.info('Role change API not implemented yet.');
  }

  toggleActive(user: AdminUser) {
    this.toast.info('Status change API not implemented yet.');
  }

  refresh() {
    this.toast.info('Refreshing users...');
    this.closeDrawer();
    this.loadAll();
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
