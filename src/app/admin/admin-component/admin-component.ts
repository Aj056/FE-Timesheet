import { Component, ViewEncapsulation, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminNav} from '../admin-nav/admin-nav';
import { RouterOutlet, Router } from '@angular/router';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';
import { PopupContainerComponent } from '../../shared/components/popup-container/popup-container.component';
import { AuthService } from '../../core/services/auth.service';
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
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private themeService = inject(ThemeService);
  
  // Theme state
  isDarkTheme = false;
  private themeSubscription?: Subscription;
  
  constructor() {
    console.log('🏢 Admin Component initialized');
  }

  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeSubscription = this.themeService.isDarkTheme$.subscribe(
      isDark => this.isDarkTheme = isDark
    );
    
    // Verify admin authentication on init
    this.verifyAdminAccess();
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
  }

  private verifyAdminAccess(): void {
    const userRole = this.authService.getUserRole();
    
    if (userRole !== 'admin') {
      console.warn('⚠️ Non-admin user attempting to access admin panel:', userRole);
      
      this.toastService.error({
        title: 'Access Denied',
        message: 'You do not have permission to access the admin panel',
        duration: 3000
      });
      
      // Redirect to appropriate dashboard
      const redirectPath = userRole === 'employee' ? '/employee' : '/auth/login';
      this.router.navigate([redirectPath], { replaceUrl: true });
    }
  }

  /**
   * Handle mobile logout with user feedback
   */
  onMobileLogout(): void {
    console.log('🚪 Mobile logout initiated');
    
    try {
      // Show loading toast
      this.toastService.info({
        title: 'Signing Out',
        message: 'Logging you out...',
        duration: 1500
      });
      
      // Perform logout
      this.authService.logout();
      console.log('✅ Logout successful');
      
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
      
    } catch (error: any) {
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
  }

  /**
   * Handle regular logout (called from template)
   */
  logout(): void {
    this.onMobileLogout();
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

  /**
   * Toggle theme between light and dark mode
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
    
    // Show feedback toast
    this.toastService.info({
      title: 'Theme Changed',
      message: `Switched to ${this.isDarkTheme ? 'light' : 'dark'} mode`,
      duration: 1500
    });
  }
}
