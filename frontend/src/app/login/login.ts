import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { ConfirmdialogService } from '../service/confirmdialog.service';
import { ToasterService } from '../service/toaster.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  loginForm: FormGroup;
  loading = false;
  errorMsg: string | null = null;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService,
    private confirm: ConfirmdialogService,
    private toaster: ToasterService
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

  onregister() {
    console.log('✅ Navigate to registration');
    this.router.navigateByUrl('/registration');
  }

  onSubmit(): void {
    console.log('✅ Login submit clicked');

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

    const remember = !!this.loginForm.value.rememberMe;

    this.auth.login(payload).subscribe({
      next: (res) => {
        // ✅ Save token properly (rememberMe based)
        if (res?.access) {
          this.auth.saveToken(res.access, remember);
        }
        if (res?.refresh) {
          this.auth.saveRefreshToken(res.refresh, remember);
        }

        // ✅ IMPORTANT: Fetch /me API to load role (Admin/User)
        this.auth.getMe().subscribe({
          next: () => {
            this.loading = false;
            this.toaster.success('Login Successful ✅');
            this.router.navigateByUrl('/dashboard', { replaceUrl: true });
          },
          error: () => {
            // ✅ Even if /me fails, still allow login
            this.loading = false;
            this.toaster.success('Login Successful ✅');
            this.router.navigateByUrl('/dashboard', { replaceUrl: true });
          },
        });
      },

      error: (err) => {
        this.loading = false;

        if (err?.status === 401) {
          this.errorMsg = 'Invalid username or password';
        } else {
          this.errorMsg =
            err?.error?.detail || 'Something went wrong. Please try again.';
        }
      },
    });
  }
}
