import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirm_password')?.value;

  if (!password || !confirm) return null;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './registration.html',
})
export class Registration {
  registerForm: FormGroup;

  loading = false;
  errorMsg: string | null = null;

  showPassword = false;
  showConfirmPassword = false;

  // ✅ change backend URL if needed
  private API_URL = 'http://192.168.65.89:8001/accounts/register/';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.registerForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        phone_number: [
          '',
          [
            Validators.required,
            Validators.pattern(/^[0-9]{10}$/), // 10 digits
          ],
        ],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirm_password: ['', [Validators.required]],
      },
      { validators: passwordMatchValidator }
    );
  }

  // ✅ for UI invalid class
  isInvalid(controlName: string): boolean {
    const c = this.registerForm.get(controlName);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  // ✅ check mismatch (for invalid feedback)
  get passwordMismatch(): boolean {
    return !!(this.registerForm.errors?.['passwordMismatch'] &&
      (this.registerForm.get('confirm_password')?.touched ||
        this.registerForm.get('confirm_password')?.dirty));
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onRegister(): void {
    this.errorMsg = null;

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    const payload = {
      username: this.registerForm.value.username,
      email: this.registerForm.value.email,
      phone_number: this.registerForm.value.phone_number,
      password: this.registerForm.value.password,
      confirm_password: this.registerForm.value.confirm_password,
    };

    this.http.post(this.API_URL, payload).subscribe({
      next: (res: any) => {
        this.loading = false;

        // ✅ if backend returns token save it
        if (res?.access) localStorage.setItem('access', res.access);
        if (res?.refresh) localStorage.setItem('refresh', res.refresh);

        // ✅ after register go to login (or dashboard)
        this.router.navigateByUrl('/login');
      },
      error: (err) => {
        this.loading = false;

        // ✅ handle backend errors (Django DRF style)
        if (err?.error) {
          if (typeof err.error === 'string') {
            this.errorMsg = err.error;
          } else if (err.error?.detail) {
            this.errorMsg = err.error.detail;
          } else {
            // show first error message from object
            const firstKey = Object.keys(err.error)[0];
            const firstMsg = err.error[firstKey]?.[0] || 'Registration failed.';
            this.errorMsg = `${firstKey}: ${firstMsg}`;
          }
        } else {
          this.errorMsg = 'Registration failed. Please try again.';
        }
      },
    });
  }
}
