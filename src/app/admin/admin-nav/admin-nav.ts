import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from "@angular/router";
import { ToastService } from '../../core/services/toast.service';
import { ThemeService } from '../../core/services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-nav',
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-nav.html',
  styleUrl: './admin-nav.scss',
  standalone: true,
  encapsulation: ViewEncapsulation.None
})
export class AdminNav implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  isDarkTheme = false;
  private themeSubscription?: Subscription;

  constructor(
    private router: Router,
    private toastService: ToastService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Admin navigation initialization
    console.log('Admin navigation initialized');
    
    // Get initial theme state
    this.isDarkTheme = this.themeService.getCurrentTheme();
    console.log('Initial admin nav theme:', this.isDarkTheme ? 'dark' : 'light');
    
    // Subscribe to theme changes
    this.themeSubscription = this.themeService.isDarkTheme$.subscribe(
      isDark => {
        this.isDarkTheme = isDark;
        console.log('Admin nav theme changed to:', isDark ? 'dark' : 'light');
        console.log('Current data-theme attribute:', document.documentElement.getAttribute('data-theme'));
        console.log('Current body classes:', document.body.className);
      }
    );
    
    if (this.themeSubscription) {
      this.subscriptions.push(this.themeSubscription);
    }
    
    // Force apply theme once more to ensure proper initialization
    setTimeout(() => {
      this.themeService.setTheme(this.themeService.getCurrentTheme());
    }, 100);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Get current admin user data from localStorage
  getCurrentAdmin(): any {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing admin user data:', error);
        return null;
      }
    }
    return null;
  }

  // View admin profile
  viewProfile(): void {
    const admin = this.getCurrentAdmin();
    if (admin) {
      this.toastService.info({
        title: 'Profile',
        message: `Welcome, ${admin.employeeName || admin.name || 'Admin'}!`,
        duration: 3000
      });
    }
  }

  // Toggle theme between light and dark
  toggleTheme(): void {
    const currentTheme = this.themeService.getCurrentTheme();
    this.themeService.toggleTheme();
    const newTheme = currentTheme ? 'light' : 'dark';
    
    this.toastService.success({
      title: 'Theme Changed',
      message: `Switched to ${newTheme} mode`,
      duration: 2000
    });
    
    console.log(`Admin theme toggled to: ${newTheme}`);
    
    // Force a small delay to ensure CSS variables are applied
    setTimeout(() => {
      console.log('Current data-theme:', document.documentElement.getAttribute('data-theme'));
      console.log('Current body classes:', document.body.className);
    }, 100);
  }

  // Admin logout with toast confirmation
  logout(): void {
    console.log('🚪 Admin logout initiated');
    
    // Show confirmation toast with action buttons
    this.toastService.warning({
      title: 'Confirm Logout',
      message: 'Are you sure you want to logout from the admin panel?',
      persistent: true,
      actions: [
        {
          label: 'Yes, Logout',
          action: () => {
            this.performLogout();
          },
          style: 'primary'
        },
        {
          label: 'Cancel',
          action: () => {
            console.log('Logout cancelled by user');
            // Toast will auto-dismiss when action is clicked
          },
          style: 'secondary'
        }
      ]
    });
  }

  private performLogout(): void {
    try {
      // Clear all authentication data immediately
      this.clearAllAuthData();
      
      // Show success message
      this.toastService.success({
        title: 'Logged Out',
        message: 'You have been logged out successfully',
        duration: 2000
      });
      
      // Force redirect to login page
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 500);
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Force logout even if there's an error
      this.clearAllAuthData();
      window.location.href = '/auth/login';
    }
  }

  private clearAllAuthData(): void {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('user');
    localStorage.removeItem('currentAdminId');
    localStorage.removeItem('currentEmployeeId');
    localStorage.removeItem('lastLoginTime');
    localStorage.removeItem('lastLogoutTime');
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    console.log('🧹 All authentication data cleared');
  }
}
