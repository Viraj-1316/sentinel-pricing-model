import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

export interface Quotation {
  id: number;
  cammera: number;
  camera_cost: number;
  ai_cost: number;
  total_costing: number;
  created_at: string;
}

export interface NotificationItem {
  title: string;
  message: string;
  time: string;
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './topbar.html',
})
export class Topbar implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  breadcrumbRoot = 'Dashboard';
  breadcrumbCurrent = 'Home';

  username = 'User';
  role = 'User';
  userInitial = 'U';

  // ✅ API
  QUOTATION_API = 'http://127.0.0.1:8001/pricing-Model/user-quotations/';

  // ✅ dashboard fields
  quotations: Quotation[] = [];
  recent: Quotation[] = [];
  totalQuotations = 0;

  latestTotal: number | null = null;
  lastActivity: string | null = null;

  // ✅ notifications
  notifications: NotificationItem[] = [];
  notificationCount = 0;

  // loading state
  loading = false;
  errorMsg: string | null = null;

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    // ✅ load user details
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
      this.username = savedUsername;
      this.userInitial = savedUsername.charAt(0).toUpperCase();
    }

    const savedRole = localStorage.getItem('role');
    if (savedRole) this.role = savedRole;

    // ✅ Load dashboard data to show notifications
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.errorMsg = null;

    this.http.get<Quotation[]>(this.QUOTATION_API).subscribe({
      next: (res) => {
        this.loading = false;

        this.quotations = res || [];
        this.totalQuotations = this.quotations.length;

        // recent 5
        this.recent = this.quotations.slice(0, 5);

        // latest quotation
        if (this.quotations.length > 0) {
          const latest = this.quotations[0]; // because backend order_by('-created_at')
          this.latestTotal = latest.total_costing;
          this.lastActivity = latest.created_at;
        } else {
          this.latestTotal = null;
          this.lastActivity = null;
        }

        // ✅ notifications creation
        this.notifications = this.recent.map((q) => ({
          title: 'Quotation Generated',
          message: `Quotation #${q.id} generated successfully (₹${q.total_costing})`,
          time: new Date(q.created_at).toLocaleString(),
        }));

        // ✅ notification count = number of notifications
        this.notificationCount = this.notifications.length;
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.detail || 'Failed to load dashboard.';
      },
    });
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');

    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
