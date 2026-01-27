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
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('password2')?.value;

  if (!password || !confirm) return null;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterLink],
  templateUrl: './registration.html',
})
export class Registration {
  registerForm: FormGroup;

  loading = false;
  errorMsg: string | null = null;

  showPassword = false;
  showConfirmPassword = false;

  private API_URL = 'http://127.0.0.1:8001/accounts/register/';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.registerForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        phone_number: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        password: ['', [Validators.required, Validators.minLength(6)]],

        // ✅ use confirm_password (same everywhere)
        password2: ['', [Validators.required]],
      },
      { validators: passwordMatchValidator }
    );
  }

  isInvalid(controlName: string): boolean {
    const c = this.registerForm.get(controlName);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  get passwordMismatch(): boolean {
    return !!(
      this.registerForm.errors?.['passwordMismatch'] &&
      (this.registerForm.get('password2')?.touched ||
        this.registerForm.get('password2')?.dirty)
    );
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
      password2: this.registerForm.value.password2,
    };

    this.http.post(this.API_URL, payload).subscribe({
      next: (res: any) => {
        this.loading = false;

        // ✅ optional token save
        if (res?.access) localStorage.setItem('access', res.access);
        if (res?.refresh) localStorage.setItem('refresh', res.refresh);

        // ✅ redirect
        this.router.navigateByUrl('/login');
      },
      error: (err) => {
        this.loading = false;

        if (err?.error) {
          const firstKey = Object.keys(err.error)?.[0];
          const firstMsg = err.error[firstKey]?.[0];
          this.errorMsg = firstMsg ? `${firstKey}: ${firstMsg}` : 'Registration failed.';
        } else {
          this.errorMsg = 'Registration failed. Please try again.';
        }
      },
    });
  }
}
