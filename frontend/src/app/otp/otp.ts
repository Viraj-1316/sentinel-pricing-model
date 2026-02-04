import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './otp.html',
  styleUrls: ['./otp.css'],
})
export class Otp {
  otp = '';
  loading = false;
  errorMsg: string | null = null;

  private VERIFY_OTP_URL = `${environment.apiBaseUrl}/accounts/verify-email-otp/`;
  private RESEND_OTP_URL = `${environment.apiBaseUrl}/accounts/send-email-otp/`;

  email = sessionStorage.getItem("reg_email");   // ✅ changed

  constructor(private http: HttpClient, private router: Router) {}

  verifyOtp() {
    this.errorMsg = null;

    const otpClean = (this.otp || '').replace(/\s+/g, ''); // ✅ remove spaces

    if (!otpClean || otpClean.length !== 6) {
      this.errorMsg = "Please enter 6 digit OTP";
      return;
    }

    if (!this.email) {
      this.errorMsg = "Email not found. Please register again.";
      return;
    }

    this.loading = true;

    const payload = {
      email: this.email, // ✅ changed
      otp: otpClean,     // ✅ cleaned otp
      full_name: sessionStorage.getItem("reg_username"),
      username: sessionStorage.getItem("reg_username"),  
      password: sessionStorage.getItem("reg_password"),
    };

    this.http.post(this.VERIFY_OTP_URL, payload).subscribe({
      next: () => {
        this.loading = false;

        // ✅ clear session
        sessionStorage.removeItem("reg_username");
        sessionStorage.removeItem("reg_email");
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
    if (!this.email) {
      alert("Email not found. Please register again.");
      return;
    }

    this.http.post(this.RESEND_OTP_URL, { email: this.email }).subscribe({
      next: () => alert("OTP resent ✅"),
      error: () => alert("Failed to resend OTP"),
    });
  }
}
