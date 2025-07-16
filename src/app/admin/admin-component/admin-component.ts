import { Component, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminNav} from '../admin-nav/admin-nav';
import { RouterOutlet, Router } from '@angular/router';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';
import { PopupContainerComponent } from '../../shared/components/popup-container/popup-container.component';
import { Authservice } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-component',
  standalone: true,
  imports: [CommonModule, AdminNav, RouterOutlet, ToastContainerComponent, PopupContainerComponent],
  templateUrl: './admin-component.html',
  styleUrls: ['./admin-component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AdminComponent {
  private authService = inject(Authservice);
  private router = inject(Router);
  
  // Theme state
  isDarkTheme = false;
  
  constructor() {
    // Initialize theme from localStorage or system preference
    this.initializeTheme();
  }
  
  /**
   * Initialize theme based on stored preference or system setting
   */
  private initializeTheme(): void {
    const storedTheme = localStorage.getItem('admin-theme');
    if (storedTheme) {
      this.isDarkTheme = storedTheme === 'dark';
    } else {
      // Use system preference
      this.isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.applyTheme();
  }
  
  /**
   * Toggle between light and dark theme
   */
  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    this.applyTheme();
    localStorage.setItem('admin-theme', this.isDarkTheme ? 'dark' : 'light');
  }
  
  /**
   * Apply the current theme to the document
   */
  private applyTheme(): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', this.isDarkTheme ? 'dark' : 'light');
    }
  }
  
  /**
   * Handle user logout
   */
  logout(): void {
    try {
      this.authService.logout();
      this.router.navigate(['/auth/login'], { 
        replaceUrl: true,
        queryParams: { message: 'logged_out' }
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation even if service fails
      this.router.navigate(['/auth/login'], { replaceUrl: true });
    }
  }
}
