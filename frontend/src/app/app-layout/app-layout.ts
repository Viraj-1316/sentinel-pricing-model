import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Sidebar, Topbar, Footer],
  templateUrl: './app-layout.html',
})
export class AppLayout {
  collapsed = false;

  toggleSidebar() {
    this.collapsed = !this.collapsed;
  }
}
