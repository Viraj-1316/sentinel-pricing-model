import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../service/auth.service';

export interface Quotation {
  id: number;
  cammera: number;
  total_costing: number;
  created_at: string;
}

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, HttpClientModule],
  templateUrl: './user-dashboard.html',
})
export class UserDashboard implements OnInit {
  loading = false;
  errorMsg: string | null = null;

  quotations: Quotation[] = [];
  recent: Quotation[] = [];

  totalQuotations = 0;
  latestTotal: number | null = null;
  lastActivity: string | null = null;

  notifications: { title: string; message: string; time: string }[] = [];

  private QUOTATION_API = 'http://127.0.0.1:8001/pricing-Model/Pricingcalculation/<int:pk>/';

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  // ✅ Load dashboard data
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
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.detail || 'Failed to load dashboard.';
      },
    });
  }

  // ✅ navigation
  goToGenerate(): void {
    this.router.navigateByUrl('/user-requirements');
  }

  goToQuotations(): void {
    this.router.navigateByUrl('/quotations');
  }

  // ✅ logout
  onLogout(): void {
    this.auth.logout();
  }
}
