import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../core/services/theme.service';
import { PopupService } from '../../core/services/popup.service';
import { ToastService } from '../../core/services/toast.service';
import { EmployeeloginFormComponent } from '../employeelogin-form/employeelogin-form';
import { AttendanceSummary } from '../attendance-summary/attendance-summary';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';
import { PopupContainerComponent } from '../../shared/components/popup-container/popup-container.component';
import { Subscription } from 'rxjs';

interface User {
  id: string;
  name: string;
  email?: string;
  username?: string;
  role?: string;
  department?: string;
}

@Component({
  selector: 'app-employeecomponent',
  imports: [RouterOutlet, CommonModule, EmployeeloginFormComponent, AttendanceSummary, ToastContainerComponent, PopupContainerComponent],
  standalone: true,
  templateUrl: './employeecomponent.html',
  styleUrl: './employeecomponent.scss',
  encapsulation: ViewEncapsulation.None
})
export class Employeecomponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  isDarkTheme = false;
  isMobileMenuOpen = false;
  private themeSubscription?: Subscription;
  
  constructor(
    private router: Router,
    private themeService: ThemeService,
    private popupService: PopupService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeSubscription = this.themeService.isDarkTheme$.subscribe(
      isDark => {
        this.isDarkTheme = isDark;
        console.log('Theme changed to:', isDark ? 'dark' : 'light');
      }
    );
  }

  ngOnDestroy(): void {
    // Cleanup subscription
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  // Get current user data from localStorage
  getCurrentUser(): User | null {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        // return null;
      }
    }
    return null;
  }

  // Get current date as formatted string
  getCurrentDateString(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Toggle user menu
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  // Refresh dashboard data
  refreshDashboard(): void {
    window.location.reload();
  }

  // Toggle theme between light and dark
  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.isMenuOpen = false;
    console.log(`Theme toggled to: ${this.isDarkTheme ? 'dark' : 'light'}`);
  }

  // View user profile - navigate to profile page
  viewProfile(): void {
    this.isMenuOpen = false;
    
    const user = this.getCurrentUser();
    if (user) {
      console.log('🔍 Navigating to profile for user:', user);
      
      this.router.navigate(['/employee/profile']).then(
        (success) => {
          if (!success) {
            console.error('❌ Navigation to profile failed');
            this.popupService.alert({
              title: 'Navigation Error',
              message: 'Unable to navigate to profile. Please try refreshing the page.',
              type: 'error',
              buttonText: 'Refresh Page'
            }).then(() => {
              window.location.reload();
            });
          }
        }
      );
    } else {
      console.warn('⚠️ No user found - redirecting to login');
      this.router.navigate(['/login']);
    }
  }

  // View payslip - navigate to payslip download page
  viewPayslip(): void {
    this.isMenuOpen = false;
    
    const user = this.getCurrentUser();
    if (user) {
      console.log('💰 Navigating to payslip for user:', user);
      
      this.router.navigate(['/employee/payslip']).then(
        (success) => {
          if (!success) {
            console.error('❌ Navigation to payslip failed');
            this.popupService.alert({
              title: 'Navigation Error',
              message: 'Unable to navigate to payslip page. Please try refreshing the page.',
              type: 'error',
              buttonText: 'Refresh Page'
            }).then(() => {
              window.location.reload();
            });
          }
        }
      );
    } else {
      console.warn('⚠️ No user found - redirecting to login');
      this.router.navigate(['/login']);
    }
  }

  // View attendance history
  viewAttendanceHistory(): void {
    this.isMenuOpen = false;
    console.log('View attendance history');
    
    this.popupService.alert({
      title: 'Feature Coming Soon',
      message: 'The attendance history feature is currently under development and will be available soon!',
      buttonText: 'Got it',
      type: 'info'
    }).then(() => {
      console.log('Attendance history alert dismissed');
    });
  }

  // Logout user
  logout(): void {
    this.isMenuOpen = false;
    
    // Use PopupService for logout confirmation
    this.popupService.logoutConfirm().then((result) => {
      if (result.action === 'confirm') {
        console.log('🚪 Employee logout initiated');
        
        try {
          // Clear all stored data
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('currentEmployeeId');
          localStorage.removeItem('lastLoginTime');
          localStorage.removeItem('lastLogoutTime');
          sessionStorage.clear();
          
          // Show success toast
          this.toastService.success({
            title: 'Logged Out Successfully',
            message: 'You have been successfully logged out. Redirecting to login page...',
            duration: 3000
          });
          
          // Navigate to login page
          this.router.navigate(['/auth/login']).then(
            (success) => {
              if (!success) {
                console.warn('❌ Navigation failed, using fallback');
                window.location.href = '/auth/login';
              }
            }
          ).catch((error) => {
            console.error('❌ Navigation error:', error);
            window.location.href = '/auth/login';
          });
        } catch (error) {
          console.error('❌ Logout error:', error);
          // Show error toast
          this.toastService.error({
            title: 'Logout Error',
            message: 'An error occurred during logout. Clearing session data...',
            duration: 4000
          });
          // Fallback: clear everything and redirect anyway
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '/auth/login';
        }
      }
    }).catch((error) => {
      console.error('❌ Logout confirmation error:', error);
      // If popup fails, show toast error
      this.toastService.error({
        title: 'System Error',
        message: 'Unable to show logout confirmation. Please try again.',
        duration: 4000
      });
    });
  }

  // Close menu when clicking outside (optional)
  closeMenuOnOutsideClick(): void {
    this.isMenuOpen = false;
  }

  // Mobile menu toggle
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}
