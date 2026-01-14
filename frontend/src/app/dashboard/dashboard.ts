import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  constructor(private auth: AuthService, private router: Router) {}

  onLogout(): void {
    this.auth.logout();

    // replaceUrl prevents going back to dashboard after logout
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
