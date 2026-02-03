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
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule,RouterLink],
  templateUrl: './registration.html',
  styleUrls: ['./registration.css'],
})
export class Registration {
  registerForm: FormGroup;

  loading = false;
  errorMsg: string | null = null;

  showPassword = false;
  showConfirmPassword = false;

  private SEND_OTP_URL = 'http://127.0.0.1:8001/accounts/send-email-otp/';

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

  const email = this.registerForm.value.email;

  // ✅ 1) Send OTP API call (Email)
  this.http.post(this.SEND_OTP_URL, { email: email }).subscribe({
    next: (res: any) => {
      this.loading = false;

      // ✅ 2) Store registration data temporarily for OTP verify page
      sessionStorage.setItem("reg_username", this.registerForm.value.username);
      sessionStorage.setItem("reg_email", email);
      sessionStorage.setItem("reg_password", this.registerForm.value.password);

      // ✅ 3) Redirect to OTP page
      this.router.navigateByUrl("/otp");
    },
    error: (err) => {
      this.loading = false;
      this.errorMsg = err?.error?.message || "Failed to send OTP. Try again.";
    },
  });
}

}