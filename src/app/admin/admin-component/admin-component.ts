import { Component, ViewEncapsulation, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminNav} from '../admin-nav/admin-nav';
import { RouterOutlet, Router } from '@angular/router';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';
import { PopupContainerComponent } from '../../shared/components/popup-container/popup-container.component';
import { Authservice } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeService } from '../../core/services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-component',
  standalone: true,
  imports: [CommonModule, AdminNav, RouterOutlet, ToastContainerComponent, PopupContainerComponent],
  templateUrl: './admin-component.html',
  styleUrls: ['./admin-component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AdminComponent implements OnInit, OnDestroy {
  private authService = inject(Authservice);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private themeService = inject(ThemeService);
  
  // Theme state
  isDarkTheme = false;
  private themeSubscription?: Subscription;
  
  constructor() {
    console.log('Admin component initialized');
  }
  
  ngOnInit(): void {
    // Initialize theme using theme service
    this.isDarkTheme = this.themeService.getCurrentTheme();
    
    // Subscribe to theme changes
    this.themeSubscription = this.themeService.isDarkTheme$.subscribe(
      isDark => {
        this.isDarkTheme = isDark;
        console.log('Admin component theme changed to:', isDark ? 'dark' : 'light');
      }
    );
  }
  
  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }
  
  /**
   * Toggle between light and dark theme
   */
  toggleTheme(): void {
    console.log('🎨 Mobile theme toggle clicked');
    this.themeService.toggleTheme();
    
    // Show toast feedback for mobile users
    const newTheme = this.themeService.getCurrentTheme() ? 'dark' : 'light';
    this.toastService.success({
      title: 'Theme Changed',
      message: `Switched to ${newTheme} mode`,
      duration: 2000
    });
    
    console.log(`Mobile theme toggled to: ${newTheme}`);
  }
  
  /**
   * Handle user logout with mobile feedback
   */
  logout(): void {
    console.log('🚪 Mobile logout initiated');
    
    try {
      // Show loading toast
      this.toastService.info({
        title: 'Signing Out',
        message: 'Logging you out...',
        duration: 1500
      });
      
      // Perform logout
      this.authService.logout().subscribe({
        next: (response) => {
          console.log('✅ Logout successful:', response);
          
          // Show success toast
          this.toastService.success({
            title: 'Signed Out',
            message: 'You have been successfully logged out',
            duration: 2000
          });
          
          // Navigate after a short delay to show the toast
          setTimeout(() => {
            this.router.navigate(['/auth/login'], { 
              replaceUrl: true,
              queryParams: { message: 'logged_out' }
            });
          }, 1000);
        },
        error: (error) => {
          console.error('❌ Logout error:', error);
          
          // Show error toast
          this.toastService.error({
            title: 'Logout Error',
            message: 'There was an issue signing out. Redirecting anyway...',
            duration: 2000
          });
          
          // Force navigation even if service fails
          setTimeout(() => {
            this.router.navigate(['/auth/login'], { replaceUrl: true });
          }, 1000);
        }
      });
    } catch (error) {
      console.error('❌ Logout exception:', error);
      
      // Show error toast
      this.toastService.error({
        title: 'Logout Error',
        message: 'Unexpected error occurred. Redirecting...',
        duration: 2000
      });
      
      // Force navigation
      setTimeout(() => {
        this.router.navigate(['/auth/login'], { replaceUrl: true });
      }, 1000);
    }
  }
  
  /**
   * Handle mobile navigation clicks with feedback
   */
  onMobileNavClick(route: string, label: string): void {
    console.log(`📱 Mobile nav clicked: ${label} -> ${route}`);
    
    // Optional: Add haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // Optional: Show brief loading state
    this.toastService.info({
      title: 'Navigating',
      message: `Loading ${label}...`,
      duration: 1000
    });
  }
}
