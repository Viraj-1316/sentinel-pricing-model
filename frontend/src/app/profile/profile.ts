import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface UserProfile {
  username: string;
  email: string;
  phone_number: string;     // ✅ keep string for 10-digit number
  role?: string;

  // optional
  date_joined?: string;
  last_login?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './profile.html',
})
export class Profile implements OnInit {

  PROFILE_API = 'http://127.0.0.1:8001/accounts/api/me/';

  loading = false;
  saving = false;
  errorMsg: string | null = null;
  successMsg: string | null = null;

  role: 'Admin' | 'User' = 'User';
  isAdmin = false;

  profile: UserProfile = {
    username: '',
    email: '',
    phone_number: '',     // ✅ must be initialized
    role: 'User',
  };

  editMode = false;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    const savedRole = (localStorage.getItem('role') || 'User') as 'Admin' | 'User';
    this.role = savedRole;
    this.isAdmin = savedRole.toLowerCase() === 'admin';

    const savedUsername = localStorage.getItem('username');
    if (savedUsername) this.profile.username = savedUsername;

    const savedEmail = localStorage.getItem('email');
    if (savedEmail) this.profile.email = savedEmail;

    const savedPhone = localStorage.getItem('phone_number');
    if (savedPhone) this.profile.phone_number = savedPhone;

    this.fetchProfile();
  }

  fetchProfile() {
    this.loading = true;
    this.errorMsg = null;

    this.http.get<UserProfile>(this.PROFILE_API).subscribe({
      next: (res) => {
        this.loading = false;
        if (!res) return;

        const apiRole = (res.role || this.role || 'User') as any;

        this.profile = {
          ...this.profile,
          ...res,
          role: apiRole,
        };

        this.role = (this.profile.role || 'User') as any;
        this.isAdmin = (this.role || '').toLowerCase() === 'admin';

        // ✅ save in localstorage
        localStorage.setItem('username', this.profile.username || '');
        localStorage.setItem('email', this.profile.email || '');
        localStorage.setItem('phone_number', this.profile.phone_number || '');
        localStorage.setItem('role', this.role);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg =
          err?.error?.detail || 'Profile API not available. Showing local data.';
      },
    });
  }

  toggleEdit() {
    this.editMode = !this.editMode;
    this.successMsg = null;
    this.errorMsg = null;
  }

  saveProfile() {
    this.saving = true;
    this.successMsg = null;
    this.errorMsg = null;

    // ✅ include phone_number if you want to update it too
    const payload = {
      email: this.profile.email,
      phone_number: this.profile.phone_number,

    };

    this.http.put<UserProfile>(this.PROFILE_API, payload).subscribe({
      next: (res) => {
        this.saving = false;
        this.successMsg = 'Profile updated successfully ✅';
        this.editMode = false;

        this.profile = { ...this.profile, ...res };

        localStorage.setItem('email', this.profile.email || '');
        localStorage.setItem('phone_number', this.profile.phone_number || '');
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
    localStorage.clear();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  get initials(): string {
    const u = this.profile?.username?.trim() || 'U';
    return u.charAt(0).toUpperCase();
  }
}
