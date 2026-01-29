import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../service/auth.service';

// ✅ import both dashboard UI components
import { AdminDashboard } from '../admin-dashboard/admin-dashboard';
import { UserDashboard } from '../user-dashboard/user-dashboard';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, AdminDashboard, UserDashboard],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  loading = true;
  isAdmin = false;

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    // ✅ Call /me and decide role
    this.auth.getMe().subscribe({
      next: (res) => {
        console.log('User info:', res);
        this.isAdmin = res.is_staff || res.is_superuser;
        this.loading = false;
      },
      error: () => {
        this.isAdmin = false;
        this.loading = false;
      },
    });
  }
}
