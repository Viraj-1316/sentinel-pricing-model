import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
<<<<<<< HEAD
import { ToasterService } from '../service/toaster.service';
export interface QuotationRow {
  id: number;
  cammera: number;
  camera_cost: number;
  ai_cost: number;
  total_costing: number;
  created_at: string;
  cpu_cost: number;
  gpu_cost: number;
  storage_cost: number;
  ai_features: AiFeature[];
  // admin fields
  username?: string;
  email?: string;
}
export interface AiFeature {
  id: number;
  AI_feature: string;
  costing: number;
}

=======
>>>>>>> backup-before-fixes
 
@Component({
  selector: 'app-qoutation-form',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './qoutation-form.html',
  styleUrl: './qoutation-form.css'
})
<<<<<<< HEAD

=======
>>>>>>> backup-before-fixes
export class QoutationForm implements OnInit {
 
  quotationId!: number;
  quotationData: any = null;
  loading = false;
  errorMsg = '';
<<<<<<< HEAD
  quotations: QuotationRow[] = [];
  filtered: QuotationRow[] = [];
=======
>>>>>>> backup-before-fixes
 
  // Toggles
  includeCPU = true;
  includeGPU = true;
  includeAI = true;
  includeStorage = true;
<<<<<<< HEAD

=======
>>>>>>> backup-before-fixes
 
  private API =
    'http://127.0.0.1:8001/pricing-Model/Pricingcalculation';
 
  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private toast: ToasterService
  ) {}
 
  ngOnInit(): void {
    this.quotationId = Number(this.route.snapshot.paramMap.get('id'));
 
    if (!this.quotationId) {
      this.errorMsg = 'Invalid quotation ID';
      return;
    }

    this.fetchQuotation();
  }

  // ================= FETCH =================
  fetchQuotation(): void {
    this.loading = true;

    this.http.get<any>(`${this.API}/${this.quotationId}/`)
      .subscribe({
   next: (res) => {
  this.quotationData = res;

  // Clear stale objects if disabled
  if (!this.includeCPU) {
    this.quotationData.cpu = null;
    this.quotationData.cpu_cost = 0;
  }

  if (!this.includeGPU) {
    this.quotationData.gpu = null;
    this.quotationData.gpu_cost = 0;
  }

  this.loading = false;
}}
);
  }
 downloadPdf() {
  if (!this.quotationData?.id) return;

  const id = this.quotationData.id;
  const url = `http://127.0.0.1:8001/pricing-Model/quotation/${id}/pdf/`;

  this.toast.info(`Downloading PDF #${id}...`);

  this.http.get(url, { responseType: 'blob' }).subscribe({
    next: (blob) => {
      const file = new Blob([blob], { type: 'application/pdf' });
      const downloadURL = window.URL.createObjectURL(file);

      const a = document.createElement('a');
      a.href = downloadURL;
      a.download = `quotation_${id}.pdf`;
      a.click();

      window.URL.revokeObjectURL(downloadURL);
      this.toast.success(`PDF downloaded: #${id}`);
    },
    error: () => {
      this.toast.error('Failed to download PDF');
    },
  });
}

 // ================= UPDATE =================
  updateQuotation(): void {
    const payload = {
      include_cpu: this.includeCPU,
      include_gpu: this.includeGPU,
      include_ai: this.includeAI,
      include_storage: this.includeStorage
    };
 
    this.loading = true;
 
    this.http.patch<any>(
      `${this.API}/${this.quotationId}/`,
      payload
    ).subscribe({
      next: (res) => {
        this.quotationData = res;
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Failed to update quotation';
        this.loading = false;
      }
    });
  }
}
 