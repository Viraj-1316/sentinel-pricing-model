import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  type: ToastType;
  title?: string;
  message: string;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class Toast {
  constructor(
    public ref: MatSnackBarRef<Toast>,
    @Inject(MAT_SNACK_BAR_DATA) public data: ToastData
  ) {}

  close(): void {
    this.ref.dismiss();
  }

  get icon(): string {
    switch (this.data.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '✅';
    }
  }
}
