import { Component, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmdialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmdialog.html',
  styleUrls: ['./confirmdialog.css']
})
export class Confirmdialog {

  title!: string;
  message!: string;

  private resolver!: (value: boolean) => void;

  constructor(private el: ElementRef) {}

  open(title: string, message: string): Promise<boolean> {
    this.title = title;
    this.message = message;

    return new Promise(resolve => {
      this.resolver = resolve;
    });
  }

  confirm() {
    this.resolver(true);
    this.destroy();
  }

  cancel() {
    this.resolver(false);
    this.destroy();
  }

  private destroy() {
    const native = this.el.nativeElement;
    if (native?.parentNode) {
      native.parentNode.removeChild(native);
    }
  }
}
