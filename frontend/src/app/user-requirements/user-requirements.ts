import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PricingService } from '../service/pricing.service';


@Component({
  selector: 'app-user-requirements',
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

  loadAIFeatures() {
    this.pricingService.getAIFeatures().subscribe(res => {
      this.aiFeatures = res;
    });
  }

  submit() {
    if (this.form.invalid) return;

    this.loading = true;
    this.quotation = null;

    this.pricingService.calculatePricing(this.form.value)
      .subscribe(res => {
        this.loading = false;
        this.loadLatestQuotation();
      });
  }

  loadLatestQuotation() {
    this.pricingService.getUserQuotations()
      .subscribe(res => {
        this.quotation = res[0]; // latest quotation
      });
  }
}
