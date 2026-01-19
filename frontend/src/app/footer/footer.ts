import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.html',
})
export class Footer {
  year = new Date().getFullYear();

  appName = "Sentinel Pricing";
  version = "v1.0.0"; // you can change anytime
}
