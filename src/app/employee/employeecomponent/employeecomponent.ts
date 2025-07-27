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
  designation?: string;
  workLocation?: string;
  phone?: string;
  address?: string;
  joinDate?: string;
  panNumber?: string;
  esiNumber?: string;
  uanNumber?: string;
  bankAccount?: string;
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
  currentUser: User | null = null; // Cache user data to prevent repeated calls
  private themeSubscription?: Subscription;
  
  constructor(
    private router: Router,
    private themeService: ThemeService,
    private popupService: PopupService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Load user data once during initialization
    this.loadCurrentUser();
    
    // Subscribe to theme changes
    this.themeSubscription = this.themeService.isDarkTheme$.subscribe(
      isDark => {
        this.isDarkTheme = isDark;
      }
    );
  }

  ngOnDestroy(): void {
    // Cleanup subscription
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  // Load current user data from localStorage (called once during initialization)
  private loadCurrentUser(): void {
    //need To remove All Code With View API
    // Check for individual auth data in localStorage (correct format)
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    
    // Try to get additional profile data from localStorage
    const designation = localStorage.getItem('designation');
    const department = localStorage.getItem('department');
    const workLocation = localStorage.getItem('workLocation');
    const phone = localStorage.getItem('phone');
    const address = localStorage.getItem('address');
    const joinDate = localStorage.getItem('joinDate');
    const panNumber = localStorage.getItem('panNumber');
    const esiNumber = localStorage.getItem('esiNumber');
    const uanNumber = localStorage.getItem('uanNumber');
    const bankAccount = localStorage.getItem('bankAccount');
    
    // Try to get full employee data if stored as JSON
    let employeeData = null;
    try {
      const storedEmployeeData = localStorage.getItem('currentUserEmployeeData');
      if (storedEmployeeData) {
        employeeData = JSON.parse(storedEmployeeData);
      }
    } catch (e) {
      console.warn('Could not parse employee data from localStorage');
    }
    
    if (userId && userName && token) {
      // Construct user object from individual localStorage items or employee data
      this.currentUser = {
        id: userId,
        name: userName,
        email: userEmail || employeeData?.employeeEmail || '',
        username: userEmail || userName || employeeData?.username,
        role: role || employeeData?.role || 'employee',
        department: department || employeeData?.department || 'Software Development',
        designation: designation || employeeData?.designation || 'Software Developer',
        workLocation: workLocation || employeeData?.workLocation || '',
        phone: phone || employeeData?.phone || '',
        address: address || employeeData?.address || '',
        joinDate: joinDate || employeeData?.joinDate || '',
        panNumber: panNumber || employeeData?.panNumber || '',
        esiNumber: esiNumber || employeeData?.esiNumber || '',
        uanNumber: uanNumber || employeeData?.uanNumber || '',
        bankAccount: bankAccount || employeeData?.bankAccount || ''
      };
      
      console.log('✅ User data loaded from localStorage:', {
        id: userId,
        name: userName,
        email: this.currentUser.email,
        role: this.currentUser.role,
        department: this.currentUser.department,
        designation: this.currentUser.designation
      });
    } else {
      console.log('❌ User data not found in localStorage:', {
        userId: !!userId,
        userName: !!userName,
        userEmail: !!userEmail,
        token: !!token
      });
      
      this.currentUser = null;
    }
  }

  // Get current user data (now returns cached data instead of reading localStorage repeatedly)
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Get user initials (first two characters of the name)
  getUserInitials(): string {
    const user = this.getCurrentUser();
    if (!user?.name) return 'US'; // Default initials
    
    const names = user.name.trim().split(' ');
    if (names.length === 1) {
      // Single name - take first two characters
      return names[0].substring(0, 2).toUpperCase();
    } else {
      // Multiple names - take first character of first two words
      return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
    }
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
