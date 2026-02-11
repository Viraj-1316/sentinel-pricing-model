import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
type ActiveTab = 'account' | 'security' | 'preferences' | 'notifications' | 'admin';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './settings.html',
})
export class Settings implements OnInit {
  // UI
  activeTab: ActiveTab = 'account';
  loading = false;
  saving = false;

  successMsg: string | null = null;
  errorMsg: string | null = null;

  // Identity
  username = 'User';
  role: 'Admin' | 'User' = 'User';
  isAdmin = false;
currentPasswordVerified = false;
verifyingPassword = false;
savingPassword = false;

  // Settings model (Enterprise-style grouped object)
  settings = {
    account: {
      email: '',
      phone_number: '',
      orgName: 'Sentinel Technologies',
      region: 'India',
    },
    security: {
      twoFactor: false,
      loginAlerts: true,
      sessionTimeoutMin: 30,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    preferences: {
      appearance: 'light' as 'light' | 'dark' | 'system',
      accent: 'blue' as 'blue' | 'purple' | 'green' | 'orange',
      compactMode: false,
      animations: true,
      defaultLanding: '/dashboard',
    },
    notifications: {
      productUpdates: true,
      pricingAlerts: true,
      quotationEmails: true,
      weeklyReports: false,
      sound: false,
    },
    admin: {
      allowUserRegistration: true,
      enableAuditLogs: true,
      enforce2FA: false,
      restrictAIToAdmins: false,
      maintenanceMode: false,
    }
  };

  constructor(private router: Router, private http: HttpClient) {}
  VERIFY_PASSWORD_API = "${environment.apiBaseUrl}/accounts/verify-password/";
 ME_API = `${environment.apiBaseUrl}/accounts/api/me/`;
  ngOnInit(): void {
    this.username = localStorage.getItem('username') || 'User';
    this.role = (localStorage.getItem('role') || 'User') as any;
    this.isAdmin = this.role?.toLowerCase() === 'admin';

    // load profile info from storage (or API)
    this.settings.account.email = localStorage.getItem('email') || '';
    this.settings.account.phone_number = localStorage.getItem('phone_number') || '';

    // restore settings from localStorage if present
    const saved = localStorage.getItem('app_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.settings = { ...this.settings, ...parsed };
      } catch {}
    }

    // apply theme/accent immediately (premium feel)
    this.applyAppearance();
  }
  UPDATE_PASSWORD_API = "${environment.apiBaseUrl}/accounts/change-password/";

updatePassword() {
  this.resetMessages();

  if (!this.currentPasswordVerified) {
    this.errorMsg = "Verify current password first.";
    return;
  }

  if (this.settings.security.newPassword.length < 6) {
    this.errorMsg = "New password must be at least 6 characters.";
    return;
  }

  if (this.settings.security.newPassword !== this.settings.security.confirmPassword) {
    this.errorMsg = "New password and confirm password do not match.";
    return;
  }

  this.savingPassword = true;

  const payload = {
    current_password: this.settings.security.currentPassword,
    new_password: this.settings.security.newPassword,
  };

  this.http.post(this.UPDATE_PASSWORD_API, payload).subscribe({
    next: () => {
      this.savingPassword = false;
      this.successMsg = "Password updated successfully ✅";

      // ✅ reset fields
      this.settings.security.currentPassword = '';
      this.settings.security.newPassword = '';
      this.settings.security.confirmPassword = '';

      this.currentPasswordVerified = false;
    },
    error: (err) => {
      this.savingPassword = false;
      this.errorMsg = err?.error?.message || "Failed to update password.";
    }
  });
}

verifyCurrentPassword() {
  this.resetMessages();

  const currentPassword = this.settings.security.currentPassword;

  if (!currentPassword) {
    this.errorMsg = "Please enter current password first.";
    return;
  }

  this.verifyingPassword = true;

  this.http.post(this.VERIFY_PASSWORD_API, { password: currentPassword }).subscribe({
    next: (res: any) => {
      this.verifyingPassword = false;

      // ✅ verified
      this.currentPasswordVerified = true;
      this.successMsg = "Current password verified ✅";
    },
    error: (err) => {
      this.verifyingPassword = false;
      this.currentPasswordVerified = false;
      this.errorMsg = err?.error?.message || "Wrong current password ❌";
    }
  });
}

  initials(): string {
    const u = (this.username || 'U').trim();
    return u.charAt(0).toUpperCase();
  }

  setTab(tab: ActiveTab) {
    this.activeTab = tab;
    this.successMsg = null;
    this.errorMsg = null;
  }

  resetMessages() {
    this.successMsg = null;
    this.errorMsg = null;
  }

  saveSettings() {
    this.saving = true;
    this.resetMessages();

    // ✅ validations
    if (this.settings.security.newPassword || this.settings.security.confirmPassword) {
      if (!this.settings.security.currentPassword) {
        this.saving = false;
        this.errorMsg = 'Current password is required to change password.';
        return;
      }
      if (this.settings.security.newPassword.length < 6) {
        this.saving = false;
        this.errorMsg = 'New password must be at least 6 characters.';
        return;
      }
      if (this.settings.security.newPassword !== this.settings.security.confirmPassword) {
        this.saving = false;
        this.errorMsg = 'New password and confirm password do not match.';
        return;
      }
    }

    // ✅ store to localStorage (enterprise default)
    localStorage.setItem('app_settings', JSON.stringify(this.settings));
    localStorage.setItem('email', this.settings.account.email || '');
    localStorage.setItem('phone_number', this.settings.account.phone_number || '');

    // apply theme/accent
    this.applyAppearance();

    // In real enterprise app, here you call API PUT to backend.
    setTimeout(() => {
      this.saving = false;
      this.successMsg = 'Settings saved successfully ✅';
    }, 400);
  }

applyAppearance() {
  const html = document.documentElement;
  const body = document.body;
  
  // Remove existing theme classes
  html.classList.remove('theme-light', 'theme-dark');
  body.classList.remove('theme-light', 'theme-dark');
  
  // Remove existing accent classes
  html.classList.remove('accent-blue', 'accent-purple', 'accent-green', 'accent-orange');
  
  // Apply appearance mode
  const appearance = this.settings.preferences.appearance || 'dark';
  
  if (appearance === 'light') {
    html.classList.add('theme-light');
    body.classList.add('theme-light');
    html.setAttribute('data-bs-theme', 'light');
  } else if (appearance === 'dark') {
    html.classList.add('theme-dark');
    body.classList.add('theme-dark');
    html.setAttribute('data-bs-theme', 'dark');
  } else if (appearance === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = prefersDark ? 'dark' : 'light';
    html.classList.add(`theme-${theme}`);
    body.classList.add(`theme-${theme}`);
    html.setAttribute('data-bs-theme', theme);
  }
  
  // Apply accent color
  const accent = this.settings.preferences.accent || 'blue';
  html.classList.add(`accent-${accent}`);
  
  // Apply compact mode
  if (this.settings.preferences.compactMode) {
    body.classList.add('compact-mode');
  } else {
    body.classList.remove('compact-mode');
  }
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
    localStorage.removeItem('phone_number');

    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
