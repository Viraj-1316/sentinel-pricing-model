import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

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
    private router: Router,
    private auth: AuthService
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

    this.loading = true;

    const payload = {
      username: this.loginForm.value.username,
      password: this.loginForm.value.password,
    };

    this.auth.login(payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        this.loading = false;

        // Django usually returns 401 if invalid
        if (err?.status === 401) {
          this.errorMsg = 'Invalid username or password';
        } else {
          this.errorMsg = 'Something went wrong. Please try again.';
        }
      },
    });
  }
}
