import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './otp.html',
})
export class Otp {
  otp = '';
  loading = false;
  errorMsg: string | null = null;

  private VERIFY_OTP_URL = 'http://127.0.0.1:8001/accounts/verify-phone-otp/';
  private RESEND_OTP_URL = 'http://127.0.0.1:8001/accounts/send-phone-otp/';

  phone = sessionStorage.getItem("reg_phone");

  constructor(private http: HttpClient, private router: Router) {}

  verifyOtp() {
    this.errorMsg = null;

    if (!this.otp || this.otp.length !== 6) {
      this.errorMsg = "Please enter 6 digit OTP";
      return;
    }

    this.loading = true;

    const payload = {
      phone: sessionStorage.getItem("reg_phone"),
      otp: this.otp,
      full_name: sessionStorage.getItem("reg_username"), // OR your full name field
      password: sessionStorage.getItem("reg_password"),
    };

    this.http.post(this.VERIFY_OTP_URL, payload).subscribe({
      next: () => {
        this.loading = false;

        // ✅ clear session
        sessionStorage.removeItem("reg_username");
        sessionStorage.removeItem("reg_email");
        sessionStorage.removeItem("reg_phone");
        sessionStorage.removeItem("reg_password");

        alert("Account created successfully ✅");

        this.router.navigateByUrl("/login");
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || "Invalid OTP";
      },
    });
  }

  resendOtp() {
    if (!this.phone) return;

    this.http.post(this.RESEND_OTP_URL, { phone: this.phone }).subscribe({
      next: () => alert("OTP resent ✅"),
      error: () => alert("Failed to resend OTP"),
    });
  }
}
