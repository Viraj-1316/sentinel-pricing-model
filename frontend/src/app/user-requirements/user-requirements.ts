import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { PricingService } from '../service/pricing.service';

@Component({
  selector: 'app-user-requirements',
  standalone: true,
  imports: [
    CommonModule,          // ngIf, ngFor, pipes
    ReactiveFormsModule,   // formGroup, formControl
    HttpClientModule,
    DatePipe               // date pipe
  ],
  templateUrl: './user-requirements.html'
})
export class UserRequirements implements OnInit {

  form!: FormGroup;
  aiFeatures: any[] = [];
  quotation: any = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private pricingService: PricingService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      cammera: ['', [Validators.required, Validators.min(1)]],
      ai_features: [[]]
    });

    this.loadAIFeatures();
  }

  loadAIFeatures(): void {
    this.pricingService.getAIFeatures().subscribe(res => {
      this.aiFeatures = res;
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.quotation = null;

    this.pricingService.calculatePricing(this.form.value)
      .subscribe(() => {
        this.loading = false;
        this.loadLatestQuotation();
      });
  }

  loadLatestQuotation(): void {
    this.pricingService.getUserQuotations()
      .subscribe(res => {
        this.quotation = res[0]; // latest quotation
      });
  }
}
