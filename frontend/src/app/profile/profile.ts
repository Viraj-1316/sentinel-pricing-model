import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';  
interface UserProfile {
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  date_joined?: string;
  last_login?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule,FormsModule],
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  // ✅ API (change as per your backend)
  PROFILE_API = 'http://127.0.0.1:8001/accounts/api/me/'; // recommended endpoint

  loading = false;
  saving = false;
  errorMsg: string | null = null;
  successMsg: string | null = null;

  // ✅ role based UI
  role: 'Admin' | 'User' = 'User';
  isAdmin = false;

  // ✅ display data
  profile: UserProfile = {
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'User',
  };

  // ✅ edit mode
  editMode = false;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    const savedRole = (localStorage.getItem('role') || 'User') as 'Admin' | 'User';
    this.role = savedRole;
    this.isAdmin = savedRole.toLowerCase() === 'admin';

    // Fallback data (if API is not ready)
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) this.profile.username = savedUsername;

    const savedEmail = localStorage.getItem('email');
    if (savedEmail) this.profile.email = savedEmail;

    // ✅ Try fetch from backend
    this.fetchProfile();
  }

  fetchProfile() {
    this.loading = true;
    this.errorMsg = null;

    this.http.get<UserProfile>(this.PROFILE_API).subscribe({
      next: (res) => {
        this.loading = false;
        if (!res) return;

        // ✅ normalize role
        const apiRole = (res.role || this.role || 'User') as any;

        this.profile = {
          ...this.profile,
          ...res,
          role: apiRole,
        };

        this.role = (this.profile.role || 'User') as any;
        this.isAdmin = (this.role || '').toLowerCase() === 'admin';

        // keep useful values in storage
        localStorage.setItem('username', this.profile.username || '');
        localStorage.setItem('email', this.profile.email || '');
        localStorage.setItem('role', this.role);
      },
      error: (err) => {
        this.loading = false;

        // If your endpoint does not exist yet, it will show this warning
        this.errorMsg =
          err?.error?.detail ||
          'Profile API not available. Showing local data.';
      },
    });
  }

  toggleEdit() {
    this.editMode = !this.editMode;
    this.successMsg = null;
    this.errorMsg = null;
  }

  saveProfile() {
    // ✅ If you don't have update endpoint, you can disable save.
    this.saving = true;
    this.successMsg = null;
    this.errorMsg = null;

    const payload = {
      first_name: this.profile.first_name,
      last_name: this.profile.last_name,
      email: this.profile.email,
    };

    this.http.put<UserProfile>(this.PROFILE_API, payload).subscribe({
      next: (res) => {
        this.saving = false;
        this.successMsg = 'Profile updated successfully ✅';
        this.editMode = false;
        this.profile = { ...this.profile, ...res };

        localStorage.setItem('email', this.profile.email || '');
      },
      error: (err) => {
        this.saving = false;
        this.errorMsg = err?.error?.detail || 'Failed to update profile.';
      },
    });
  }

  goDashboard() {
    this.router.navigateByUrl('/dashboard');
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('role');

    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  get initials(): string {
    const u = this.profile?.username?.trim() || 'U';
    return u.charAt(0).toUpperCase();
  }
}
