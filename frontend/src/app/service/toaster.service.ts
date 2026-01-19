import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Toast, ToastData, ToastType } from '../toast/toast';

@Injectable({ providedIn: 'root' })
export class ToasterService {
  constructor(private snackBar: MatSnackBar) {}

  private show(type: ToastType, message: string, title?: string) {
    const data: ToastData = { type, message, title };

    this.snackBar.openFromComponent(Toast, {
      data,
      duration: 3200,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['premium-toast-panel'],
    });
  }

  success(message: string, title = 'Success') {
    this.show('success', message, title);
  }

  error(message: string, title = 'Error') {
    this.show('error', message, title);
  }

  warning(message: string, title = 'Warning') {
    this.show('warning', message, title);
  }

  info(message: string, title = 'Info') {
    this.show('info', message, title);
  }
}
