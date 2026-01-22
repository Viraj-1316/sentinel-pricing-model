import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';
import { Footer } from '../footer/footer';
import {  ElementRef, HostListener, ViewChild } from '@angular/core';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Sidebar, Topbar, Footer],
  templateUrl: './app-layout.html',
})
export class AppLayout {


  collapsed = false;

  @ViewChild('sidebarRef', { static: true }) sidebarRef!: ElementRef;
  @ViewChild('topbarToggleBtn', { static: false }) topbarToggleBtn!: ElementRef;

  toggleSidebar() {
    this.collapsed = !this.collapsed;
  }

  closeSidebar() {
    this.collapsed = true;
  }

  // ✅ click outside handler
  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: MouseEvent) {
    // if already closed -> do nothing
    if (this.collapsed) return;

    const target = event.target as HTMLElement;

    const clickedSidebar = this.sidebarRef?.nativeElement?.contains(target);
    const clickedToggleBtn = this.topbarToggleBtn?.nativeElement?.contains(target);

    // ✅ if click NOT inside sidebar and NOT on toggle button -> close
    if (!clickedSidebar && !clickedToggleBtn) {
      this.closeSidebar();
    }
  }
}

