import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

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

  constructor(private router: Router) {}

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
  const mode = this.settings.preferences.appearance; // light | dark | system
  const finalTheme =
    mode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;

  document.body.setAttribute('data-theme', finalTheme);
  localStorage.setItem('theme', finalTheme);
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
