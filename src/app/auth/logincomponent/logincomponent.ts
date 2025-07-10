import { Component, OnInit, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Authservice } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';
import { PopupService } from '../../core/services/popup.service';

@Component({
  selector: 'app-logincomponent',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './logincomponent.html',
  styleUrls: ['./logincomponent.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Logincomponent implements OnInit {
  // signals 
  showPassword = signal(false);
  username = signal('');
  password = signal('');
  isLoading = signal(false);
  showDebugButton = signal(false);
  loginAttempts = signal(0);
  maxLoginAttempts = 5;
  isAccountLocked = signal(false);
  validationErrors = signal<string[]>([]);
  loginError = signal('');

  constructor(
    private auth: Authservice,
    private router: Router,
    private toast: ToastService,
    private popup: PopupService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Check if user is already authenticated
    if (this.auth.isLoggedIN()) {
      const userRole = this.auth.getuserrole();
      if (userRole) {
        this.redirectBasedOnRole(userRole);
      }
    }
    
    // Check if account is locked due to failed attempts
    this.checkAccountLockStatus();
  }

  private redirectBasedOnRole(role: string): void {
    console.log('🔄 Redirecting user with role:', role);
    
    if (role === 'admin') {
      console.log('🔄 Navigating to /admin');
      this.router.navigate(['/admin']).then(
        (success) => {
          if (!success) {
            console.log('❌ Navigation failed, trying alternative approach');
            window.location.href = '/admin';
          }
        }
      );
    } else if (role === 'employee') {
      console.log('🔄 Navigating to /employee');
      this.router.navigate(['/employee']).then(
        (success) => {
          if (!success) {
            console.log('❌ Navigation failed, trying alternative approach');
            window.location.href = '/employee';
          }
        }
      );
    }
  }

  private checkAccountLockStatus(): void {
    const lockoutEndTime = localStorage.getItem('accountLockoutEnd');
    if (lockoutEndTime) {
      const now = new Date().getTime();
      const lockEnd = parseInt(lockoutEndTime, 10);
      this.isAccountLocked.set(now < lockEnd);
      
      if (!this.isAccountLocked()) {
        localStorage.removeItem('accountLockoutEnd');
        localStorage.removeItem('loginAttempts');
        this.loginAttempts.set(0);
      }
    }
  }

  onLogin(): void {
    console.log('🔑 Login attempt started');
    
    // Clear previous states
    this.clearLoginState();
    
    // Check if account is locked
    if (this.isAccountLocked()) {
      this.validationErrors.set(['Account is temporarily locked due to multiple failed login attempts. Please try again later.']);
      this.toast.error('Account is temporarily locked due to multiple failed login attempts. Please try again later.');
      return;
    }

    // Validate input
    if (!this.validateLoginInput()) {
      console.log('❌ Validation failed');
      return;
    }

    // Set loading state
    this.isLoading.set(true);
    this.cdr.markForCheck();
    console.log('⏳ Setting loading state to true');

    // Single timeout for debug button and final safety
    // const safetyTimeout = setTimeout(() => {
    //   if (this.isLoading()) {
    //     console.log('🚨 Login taking too long - showing debug option and resetting');
    //     this.isLoading.set(false);
    //     this.showDebugButton.set(true);
    //     this.validationErrors.set(['Login is taking longer than expected. Please try again or use the reset button below.']);
    //     this.toast.warning('Login is taking longer than expected. Please try again or use the reset button below.');
    //     this.cdr.markForCheck();
    //   }
    // }, 15000); // 15 seconds timeout

    // Perform login
    this.auth.login(this.username(), this.password()).subscribe({
      next: (response) => {
        console.log('✅ Login response received:', response);
        this.handleLoginResponse(response);
      },
      error: (error) => {
        console.error('❌ Login error:', error);
        this.handleLoginError(error);
      }
    });
  }

  private clearLoginState(): void {
    this.validationErrors.set([]);
    this.loginError.set('');
    this.showDebugButton.set(false);
  }

  private handleLoginResponse(response: any): void {
    // Clear timeout and reset loading
    // if (safetyTimeout) clearTimeout(safetyTimeout);
    // this.isLoading.set(false);
    // this.cdr.markForCheck();
    
    try {
      if (response?.success === true && response.user) {
        console.log('✅ Login successful');
        this.resetLoginAttempts();
        this.showSuccessToast();
        this.redirectUserByRole();
      } else {
        const errorMessage = response?.message || 'Login failed. Invalid username or password.';
        console.log('❌ Login failed:', errorMessage);
        this.handleLoginFailure(errorMessage);
      }
    } catch (error) {
      console.error('❌ Error processing login response:', error);
      this.handleLoginFailure('Login processing error. Please try again.');
    }
  }

  private handleLoginError(error: any): void {
    // Clear timeout and reset loading
    // if (safetyTimeout) clearTimeout(safetyTimeout);
    // this.isLoading.set(false);
    // this.cdr.markForCheck();
    
    const errorMessages = {
      0: 'Unable to connect to server. Please check your connection.',
      401: 'Invalid username or password.',
      404: 'Login service not found. Please contact administrator.',
      500: 'Server error. Please try again later.'
    };
    
    const errorMessage = errorMessages[error.status as keyof typeof errorMessages] || 
                        'Login failed. Please try again.';
    
    this.handleLoginFailure(errorMessage);
  }

  private resetLoginAttempts(): void {
    localStorage.removeItem('loginAttempts');
    localStorage.removeItem('accountLockoutEnd');
    this.loginAttempts.set(0);
  }

  private showSuccessToast(): void {
    this.toast.success('Login successful! Welcome back.');
  }

  private redirectUserByRole(): void {
    const role = this.auth.getuserrole();
    if (role) {
      this.redirectBasedOnRole(role);
    }
  }

  private validateLoginInput(): boolean {
    const errors: string[] = [];
    const username = this.username().trim();
    const password = this.password();

    // Username validation
    if (!username) {
      errors.push('Username is required');
    } else if (username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }

    // Password validation  
    if (!password) {
      errors.push('Password is required');
    } else if (password.length < 4) {
      errors.push('Password must be at least 4 characters long');
    }

    this.validationErrors.set(errors);
    return errors.length === 0;
  }

  private handleLoginFailure(errorMessage: string): void {
    console.log('🚨 Handling login failure:', errorMessage);
    
    this.resetLoadingState();
    this.showErrorMessage(errorMessage);
    this.updateLoginAttempts();
  }

  private resetLoadingState(): void {
    this.isLoading.set(false);
    this.showDebugButton.set(false);
    this.cdr.markForCheck();
  }

  private showErrorMessage(errorMessage: string): void {
    this.loginError.set(errorMessage);
    this.validationErrors.set([errorMessage]);
    this.toast.error(errorMessage);
  }

  private updateLoginAttempts(): void {
    const attempts = parseInt(localStorage.getItem('loginAttempts') || '0', 10) + 1;
    this.loginAttempts.set(attempts);
    localStorage.setItem('loginAttempts', attempts.toString());
    
    console.log('📊 Login attempts:', attempts, '/', this.maxLoginAttempts);
    
    if (attempts >= this.maxLoginAttempts) {
      this.lockAccount();
    } else {
      this.showRemainingAttempts(attempts);
    }
  }

  private lockAccount(): void {
    const lockoutTime = new Date().getTime() + (15 * 60 * 1000); // 15 minutes
    localStorage.setItem('accountLockoutEnd', lockoutTime.toString());
    this.isAccountLocked.set(true);
    
    const lockMessage = `Account locked for 15 minutes due to ${this.maxLoginAttempts} failed login attempts.`;
    this.validationErrors.set([lockMessage]);
    this.toast.error('Account locked for 15 minutes due to failed login attempts.');
    console.log('🔒 Account locked due to too many failed attempts');
  }

  private showRemainingAttempts(attempts: number): void {
    const remainingAttempts = this.maxLoginAttempts - attempts;
    this.validationErrors.update(errors => [...errors, `${remainingAttempts} attempts remaining before account lockout.`]);
    console.log('⚠️ Remaining attempts:', remainingAttempts);
  }

  // Simple and robust manual reset method
  resetLoginState(): void {
    console.log('🔄 MANUAL RESET TRIGGERED');
    
    // Reset all states
    this.isLoading.set(false);
    this.showDebugButton.set(false);
    this.validationErrors.set([]);
    this.loginError.set('');
    
    // Clear account lockout
    this.clearStorageData(['loginAttempts', 'accountLockoutEnd']);
    this.loginAttempts.set(0);
    this.isAccountLocked.set(false);
    
    // Show success message briefly
    this.showTemporaryMessage('✅ Login state reset successfully! You can now try logging in again.');
    this.toast.success('Login state reset successfully!');
    
    console.log('✅ MANUAL RESET COMPLETED');
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  // Utility methods
  private clearStorageData(keys: string[]): void {
    keys.forEach(key => localStorage.removeItem(key));
  }

  private showTemporaryMessage(message: string, duration: number = 3000): void {
    this.validationErrors.set([message]);
    this.cdr.markForCheck();
    
    setTimeout(() => {
      this.validationErrors.set([]);
      this.cdr.markForCheck();
    }, duration);
  }

  // These methods always return false to prevent red borders in UI
  hasUsernameError(): boolean { return false; }
  hasPasswordError(): boolean { return false; }

  // Test method for popup service integration
  showForgotPasswordDialog(): void {
    this.popup.confirm({
      title: 'Forgot Password',
      message: 'Password recovery is not implemented yet. Please contact your administrator for assistance.',
      confirmText: 'Contact Admin',
      cancelText: 'Cancel'
    }).then((result) => {
      if (result.action === 'confirm') {
        this.toast.info('Please contact your administrator at admin@example.com for password reset assistance.');
      }
    });
  }

  // Network connection test method
  testConnection(): void {
    if (!this.username() || !this.password()) {
      this.toast.warning({
        title: 'Test Required',
        message: 'Please enter username and password to test connection',
        duration: 3000
      });
      return;
    }

    console.log('🧪 Testing backend connection...');
    
    const loadingId = this.popup.loading({
      title: 'Testing Connection',
      message: 'Checking server connectivity...'
    });
    
    this.auth.login(this.username(), this.password()).subscribe({
      next: (result: any) => {
        this.popup.close('close', undefined, loadingId);
        const message = result.success ? 'Backend connection successful!' : 'Backend reachable but login failed';
        this.toast.success({
          title: 'Connection Test',
          message: message,
          duration: 5000
        });
      },
      error: (error: any) => {
        this.popup.close('close', undefined, loadingId);
        const message = error.status === 0 ? 'Unable to connect to backend server' : 'Backend is reachable';
        this.toast[error.status === 0 ? 'error' : 'success']({
          title: 'Connection Test',
          message: message,
          duration: 5000
        });
      }
    });
  }

  // Enhanced logout confirmation for when user is already logged in
  confirmLogout(): void {
    this.popup.confirm({
      title: 'Confirm Logout',
      message: 'Are you sure you want to log out?',
      confirmText: 'Yes, Logout',
      cancelText: 'Stay Logged In',
      icon: 'sign-out'
    }).then((result) => {
      if (result.action === 'confirm') {
        this.auth.logout();
        this.toast.success('You have been logged out successfully.');
      }
    });
  }
}
