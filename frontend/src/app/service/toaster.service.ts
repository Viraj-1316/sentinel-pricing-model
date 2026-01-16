import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToasterService {
  constructor(private snackBar: MatSnackBar) {}

  success(message: string) {
    this.show(message, 'success-snack');
  }

  error(message: string) {
    this.show(message, 'error-snack');
  }

  warning(message: string) {
    this.show(message, 'warning-snack');
  }

  info(message: string) {
    this.show(message, 'info-snack');
  }

  private show(message: string, panelClass: string) {
    this.snackBar.open(message, 'Close', {
  duration: 3000,
  horizontalPosition: 'right',
  verticalPosition: 'top',
  panelClass: ['green-snack'],
});

  }
}
