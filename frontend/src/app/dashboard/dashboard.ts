import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../service/auth.service';

// ✅ import both dashboard UI components
import { AdminDashboard } from '../admin-dashboard/admin-dashboard';
import { UserDashboard } from '../user-dashboard/user-dashboard';
import {RouterOutlet} from '@angular/router';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, AdminDashboard, UserDashboard, RouterOutlet],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  loading = true;
  isAdmin = false;
  role: 'Admin' | 'User' = 'User';

  constructor(private auth: AuthService) {}

 ngOnInit(): void {
  this.auth.getMe().subscribe({
    next: (res) => {
      console.log('User info:', res);

      // ✅ FIXED LOGIC
      this.isAdmin = res.role?.toLowerCase() === 'admin';

      this.loading = false;
    },
    error: () => {
      this.isAdmin = false;
      this.loading = false;
    },
  });
}

}
