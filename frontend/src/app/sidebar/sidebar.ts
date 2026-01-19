import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
})
export class Sidebar implements OnInit {
  @Input() collapsed = false;

  username = 'User';
  isAdmin = false;

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.auth.getMe().subscribe({
      next: (res) => {
        this.username = res.username;
        this.isAdmin = res.is_staff || res.is_superuser; // ✅ main condition
        console.log("✅ ADMIN:", this.isAdmin);
      },
      error: (err) => {
        console.log("❌ /me failed", err);
        this.isAdmin = false;
      }
    });
  }
}
