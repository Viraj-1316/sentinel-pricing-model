import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
})
export class Login {
  loginForm: FormGroup;
  loading = false;
  errorMsg: string | null = null;
  showPassword = false;
  currentYear = new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [true],
    });
  }

  isInvalid(controlName: string): boolean {
    const c = this.loginForm.get(controlName);
    return !!(c && c.invalid && (c.touched || c.dirty));
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  forgotPassword(): void {
    alert('Ask Admin to reset password. (You can implement forgot-password API later.)');
  }

  onSubmit(): void {
    this.errorMsg = null;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // UI loading simulation
    this.loading = true;

    // ✅ For now: simulate login success
    // Later you’ll connect Django API: POST /api/v1/auth/login/
    setTimeout(() => {
      this.loading = false;

      // Store dummy tokens (for UI testing)
      localStorage.setItem('access_token', 'demo_access_token');
      localStorage.setItem('refresh_token', 'demo_refresh_token');

      // Redirect to dashboard (or calculator)
      this.router.navigateByUrl('/dashboard');
    }, 1200);
  }
}
