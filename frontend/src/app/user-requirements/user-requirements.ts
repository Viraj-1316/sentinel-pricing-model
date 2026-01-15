import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PricingService } from '../service/pricing.service';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-user-requirements',
  templateUrl: './user-requirements.html',
  styleUrls: ['./user-requirements.css'] // Add styling here or in global styles
})
export class UserRequirementsComponent implements OnInit {
  form!: FormGroup;
  aiFeatures: any[] = [];
  selectedAIFeatures: any[] = [];
  
  quotation: any = null;
  showDropdown = false;
  loading = false;
  errorMsg = '';
  totalAICost = 0;

  constructor(
    private fb: FormBuilder,
    private pricingService: PricingService,
    private authService: AuthService,
    private router: Router,
    private eRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      camera: ['', [Validators.required, Validators.min(1)]],
      ai_features: [[]]
    });

    this.loadAIFeatures();
  }

  loadAIFeatures() {
    this.pricingService.getAIFeatures().subscribe({
      next: (res) => {
        this.aiFeatures = res;
      },
      error: () => this.errorMsg = 'Could not load AI features.'
    });
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  // Handle checking/unchecking a feature
  toggleFeature(ai: any) {
    const index = this.selectedAIFeatures.findIndex(f => f.id === ai.id);
    
    if (index > -1) {
      // Remove if already selected
      this.selectedAIFeatures.splice(index, 1);
      this.totalAICost -= ai.costing;
    } else {
      // Add if not selected
      this.selectedAIFeatures.push(ai);
      this.totalAICost += ai.costing;
    }

    // Sync with Reactive Form
    this.form.patchValue({
      ai_features: this.selectedAIFeatures.map(f => f.id)
    });
  }

  isSelected(ai: any): boolean {
    return this.selectedAIFeatures.some(f => f.id === ai.id);
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  submit() {
    if (this.form.invalid) return;

    this.loading = true;
    this.errorMsg = '';
    this.quotation = null;

    this.pricingService.calculatePricing(this.form.value).subscribe({
      next: res => {
        this.quotation = res;
        this.loading = false;
      },
      error: err => {
        this.errorMsg = 'Failed to generate quotation';
        this.loading = false;
      }
    });
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}