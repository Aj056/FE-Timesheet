import { Component, OnInit, OnDestroy, ChangeDetectorRef, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { ToastService } from '../../core/services/toast.service';
import { PopupService } from '../../core/services/popup.service';
import { IpCheckService, OfficeNetworkStatus } from '../../core/services/ip-check.service';

interface Employee {
  id: string;
  name: string;
  username: string;
}

interface AttendanceSession {
  loginTime?: string;
  logoutTime?: string;
  date: string;
}

interface Quote {
  content: string;
  author: string;
}

@Component({
  selector: 'app-employeelogin-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employeelogin-form.html',
  styleUrls: ['./employeelogin-form-clean.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EmployeeloginFormComponent implements OnInit, OnDestroy {
  // Core data - using signals for zoneless
  currentEmployee = signal<Employee | null>(null);
  currentSession = signal<AttendanceSession | null>(null);
  currentTime = signal<string>('');
  currentDate = signal<string>('');

  // Status - using signals
  isLoggingIn = signal(false);
  isLoggingOut = signal(false);
  networkStatus = signal<OfficeNetworkStatus>({ isConnected: false, isOfficeNetwork: false, ipAddress: '', checking: false });
  currentQuote = signal<Quote | null>(null);
  isQuoteLoading = signal(false);
  
  // Cached countdown to prevent NG0100 error
  private cachedTimeUntilLogout = signal<string>('');

  private subscriptions: Subscription[] = [];

  constructor(
    private http: HttpClient, 
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
    private popupService: PopupService,
    private ipCheckService: IpCheckService
  ) { }

  ngOnInit(): void {
    this.loadEmployee();
    this.loadSession();
    this.startTimeUpdate();
    this.initializeNetworkService();
    this.loadQuote();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Employee Management
  private loadEmployee(): void {
    // Check for individual auth data in localStorage (correct format)
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');
    const token = localStorage.getItem('token');
    
    if (userId && userName && token) {
      // Set employee data from individual localStorage items
      this.currentEmployee.set({
        id: userId,
        name: userName,
        username: userEmail || userName // Use email as username if available
      });
      
      console.log('✅ Authentication successful - User loaded:', {
        id: userId,
        name: userName,
        email: userEmail
      });
      
      // Optionally verify token is still valid
      // this.verifyAndRefreshEmployeeData(token);
    } else {
      // Missing auth data, set default and show login message
      this.currentEmployee.set({
        id: 'guest',
        name: 'Guest User',
        username: 'guest'
      });
      
      console.log('❌ Authentication failed - Missing data:', {
        userId: !!userId,
        userName: !!userName,
        token: !!token
      });
      
      // Show message that user needs to login
      this.toastService.warning({
        title: 'Authentication Required',
        message: 'Please login to access the timesheet system.',
        duration: 5000
      });
    }
  }

  private verifyAndRefreshEmployeeData(token: string): void {
    // Make a request to verify token and get fresh user data
    this.http.get<any>('https://attendance-three-lemon.vercel.app/all', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: (response) => {
        // Token is valid, you could fetch more detailed user data here if needed
        console.log('✅ Token verified successfully');
      },
      error: (error) => {
        // Token is invalid or expired
        console.warn('⚠️ Token verification failed:', error);
        this.handleInvalidToken();
      }
    });
  }

  private handleInvalidToken(): void {
    // Clear all auth-related localStorage items
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('role');
    
    // Set guest user
    this.currentEmployee.set({
      id: 'guest',
      name: 'Guest User',
      username: 'guest'
    });
    
    // Show login required message
    this.toastService.error({
      title: 'Session Expired',
      message: 'Your session has expired. Please login again.',
      duration: 5000
    });
  }

  // Utility Methods
  private formatDateToDDMMYYYY(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  private calculateTotalHours(checkinTime: string, checkoutTime: string): string {
    try {
      const checkin = new Date(`${new Date().toDateString()} ${checkinTime}`);
      const checkout = new Date(`${new Date().toDateString()} ${checkoutTime}`);
      
      const diffMs = checkout.getTime() - checkin.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Error calculating total hours:', error);
      return "0:00";
    }
  }

  // Session Management
  private loadSession(): void {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(`session_${today}`);
    const session = stored ? JSON.parse(stored) : null;
    this.currentSession.set(session);
  }

  private saveSession(): void {
    const today = new Date().toDateString();
    const session = this.currentSession();
    if (session) {
      localStorage.setItem(`session_${today}`, JSON.stringify(session));
    }
  }

  // Time Management
  private startTimeUpdate(): void {
    const timeSub = interval(1000).subscribe(() => {
      this.updateTime();
      this.cdr.detectChanges(); // Use detectChanges instead of markForCheck to prevent NG0100
    });
    this.subscriptions.push(timeSub);
    this.updateTime();
  }

  private updateTime(): void {
    const now = new Date();
    this.currentTime.set(now.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }));
    this.currentDate.set(now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));
    
    // Update cached countdown to prevent NG0100 error
    this.cachedTimeUntilLogout.set(this.calculateTimeUntilLogout());
  }

  // Network Management - using IpCheckService
  private initializeNetworkService(): void {
    // Subscribe to network status changes
    const networkSub = this.ipCheckService.networkStatus$.subscribe(status => {
      this.networkStatus.set(status);
      this.cdr.detectChanges(); // Use detectChanges instead of markForCheck to prevent NG0100
    });
    this.subscriptions.push(networkSub);
    
    // Get initial network status
    this.ipCheckService.forceRefresh().subscribe();
  }

  // Refresh network status
  refreshNetwork(): void {
    this.toastService.info('Checking network status...');
    this.ipCheckService.forceRefresh().subscribe();
  }

  // Quote Management
  private loadQuote(): void {
    this.isQuoteLoading.set(true);

    this.http.get<any[]>('https://api.realinspire.live/v1/quotes/random?limit=1').subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          this.currentQuote.set({
            content: response[0].content,
            author: response[0].author
          });
        }
        this.isQuoteLoading.set(false);
        this.cdr.detectChanges(); // Use detectChanges instead of markForCheck to prevent NG0100
      },
      error: () => {
        this.currentQuote.set({
          content: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
          author: "Winston Churchill"
        });
        this.isQuoteLoading.set(false);
        this.cdr.detectChanges(); // Use detectChanges instead of markForCheck to prevent NG0100
      }
    });
  }

  // Attendance Logic
  isLoggedIn(): boolean {
    const session = this.currentSession();
    return session?.loginTime != null && !session?.logoutTime;
  }

  canLogout(): boolean {
    if (!this.isLoggedIn()) return false;
    const session = this.currentSession();
    if (!session?.loginTime) return false;

    const loginTime = new Date(`${new Date().toDateString()} ${session.loginTime}`);
    const now = new Date();
    const timeDiff = now.getTime() - loginTime.getTime();
    const thirtyMinutes = 30 * 60 * 1000;

    return timeDiff >= thirtyMinutes;
  }

  getTimeUntilLogout(): string {
    return this.cachedTimeUntilLogout();
  }

  private calculateTimeUntilLogout(): string {
    const session = this.currentSession();
    if (!session?.loginTime) return '';

    const loginTime = new Date(`${new Date().toDateString()} ${session.loginTime}`);
    const now = new Date();
    const timeDiff = now.getTime() - loginTime.getTime();
    const thirtyMinutes = 30 * 60 * 1000;
    const remaining = thirtyMinutes - timeDiff;

    if (remaining <= 0) return '';

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  // Daily Check-in Restriction Logic
  hasCheckedInToday(): boolean {
    const session = this.currentSession();
    return session?.loginTime != null;
  }

  hasCompletedTodaySession(): boolean {
    const session = this.currentSession();
    return session?.loginTime != null && session?.logoutTime != null;
  }

  canCheckInToday(): boolean {
    // Can check in if no session exists for today OR if completed previous session
    const session = this.currentSession();
    if (!session) return true; // No session today, can check in
    
    // If there's a session, can only check in again if previous session was completed
    return session.loginTime != null && session.logoutTime != null;
  }

  // Method to refresh session data from backend
  refreshSessionFromBackend(): void {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    
    if (userId && token) {
      this.toastService.info('Refreshing session data...');
      // For now, just reload the current session from localStorage
      this.loadSession();
      this.toastService.success('Session data refreshed from local storage.');
    } else {
      this.toastService.warning('Please login to refresh session data.');
    }
  }

  // Main Actions
  employee_login(): void {
    // Prevent multiple concurrent login attempts
    if (this.isLoggingIn()) {
      return;
    }

    // Check if already logged in (local session check)
    if (this.isLoggedIn()) {
      this.toastService.warning('You are already checked in.');
      return;
    }

    // Check daily restriction - can't check in if already checked in today (unless completed previous session)
    if (!this.canCheckInToday()) {
      if (this.hasCompletedTodaySession()) {
        this.toastService.info({
          title: 'Daily Attendance Completed',
          message: 'You have already completed your attendance for today. Check-in will be available tomorrow.',
          duration: 5000
        });
      } else {
        this.toastService.warning({
          title: 'Already Checked In',
          message: 'You have already checked in today. Please check out first to complete your session.',
          duration: 5000
        });
      }
      return;
    }

    // Check authentication before proceeding
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    
    if (!userId || !token) {
      this.toastService.error({
        title: 'Authentication Error',
        message: 'Missing user credentials. Please login again.',
        duration: 4000
      });
      return;
    }

    // Proceed with network check and login flow
    this.proceedWithNetworkCheck();
  }

  private proceedWithNetworkCheck(): void {
    // Step 1: Check office network using IpCheckService
    if (!this.ipCheckService.isConnectedToOffice()) {
      // Force refresh network status first
      this.ipCheckService.forceRefresh().subscribe(status => {
        if (status.isOfficeNetwork) {
          this.proceedWithLogin();
        } else {
          // Show office network required popup
          this.toastService.warning({
            title: 'Office Network Required',
            message: `Check-in is only allowed from office network. Current IP: ${status.ipAddress}`,
            duration: 5000
          });
        }
      });
      return;
    }

    // Step 2: Proceed with login if already connected to office network
    this.proceedWithLogin();
  }

  private proceedWithLogin(): void {
    this.isLoggingIn.set(true);
    this.cdr.detectChanges();

    this.http.get<{ dateTime: string }>('https://timeapi.io/api/time/current/zone?timeZone=Asia/Kolkata').subscribe({
      next: (response) => {
        console.log(response);
        const serverTime =response;
        this.sendCheckinData(serverTime);
      },
      error: () => {
        const localTime = new Date();
        this.sendCheckinData(localTime);
      }
    });
  }

  //send data to backend
  private sendCheckinData(serverTime:any,isFallback = false): void {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const token = localStorage.getItem('token');

    if (!userId || !userName || !token) return;

    // Format date as dd.MM.yyyy (e.g., "07.07.2025")
    const currentDate = this.formatDateToDDMMYYYY(new Date());

    const payload = {
      id: userId,
      employeeName: userName,
      status: true,
      checkin: currentDate,
      checkout: currentDate, // Initially same as checkin
      totalhours: "0:00" // Will be calculated on checkout
    };

    this.http.post(`https://attendance-three-lemon.vercel.app/checkin`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      timeout(10000) // 10 second timeout to prevent getting stuck
    ).subscribe({
      next: () => {
        const loginTime = new Date().toLocaleTimeString('en-US', {
          hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        
        this.currentSession.set({
          loginTime: loginTime,
          date: new Date().toDateString()
        });
        this.saveSession();
        this.isLoggingIn.set(false);
        this.cdr.detectChanges();

        if (isFallback) {
          this.toastService.success({
            title: 'Check-in Successful',
            message: `You've checked in at ${loginTime} (local time).`,
            duration: 4000
          });
        } else {
          this.toastService.checkInSuccess(loginTime);
        }

        console.log('✅ Check-in successful at:', loginTime);
      },
      error: (err) => {
        console.error('❌ Backend check-in failed, using localStorage fallback:', err);
        
        // Always reset loading state and proceed with fallback
        this.isLoggingIn.set(false);
        this.handleCheckInFallback(serverTime, isFallback);
      }
    });
  }

  private handleCheckInFallback(serverTime: string, isFallback: boolean): void {
    const loginTime = new Date().toLocaleTimeString('en-US', {
      hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    
    // Save session locally even if backend fails
    this.currentSession.set({
      loginTime: loginTime,
      date: new Date().toDateString()
    });
    this.saveSession();
    this.cdr.detectChanges();

    // Show appropriate toast message
    this.toastService.warning({
      title: 'Check-in Completed (Offline Mode)',
      message: `Checked in at ${loginTime}. Data saved locally - will sync when server is available.`,
      duration: 5000
    });

    console.log('✅ Check-in completed with localStorage fallback at:', loginTime);
  }

  employee_logout(): void {
    // Prevent multiple concurrent logout attempts
    if (this.isLoggingOut()) {
      return;
    }

    // Check if user is logged in
    if (!this.isLoggedIn()) {
      this.toastService.warning('You are not currently checked in.');
      return;
    }

    // Check if minimum time requirement is met
    if (!this.canLogout()) {
      const remaining = this.getTimeUntilLogout();
      this.toastService.minimumTimeWarning(remaining);
      return;
    }

    // Show confirmation popup for checkout
    const workingHours = this.getWorkingHours();
    this.popupService.attendanceConfirm('checkout', `Current working time: ${workingHours}`).then((result) => {
      if (result.action === 'confirm') {
        this.performLogoutProcess();
      }
    }).catch((error) => {
      console.error('❌ Checkout confirmation error:', error);
      this.toastService.error({
        title: 'System Error',
        message: 'Unable to show checkout confirmation. Please try again.',
        duration: 4000
      });
    });
  }

  private performLogoutProcess(): void {
    // Step 1: Check office network using IpCheckService
    if (!this.ipCheckService.isConnectedToOffice()) {
      // Force refresh network status first
      this.ipCheckService.forceRefresh().subscribe(status => {
        if (status.isOfficeNetwork) {
          this.proceedWithLogout();
        } else {
          // Show office network required popup
          this.toastService.warning({
            title: 'Office Network Required',
            message: `Check-out is only allowed from office network. Current IP: ${status.ipAddress}`,
            duration: 5000
          });
        }
      });
      return;
    }

    // Step 2: Proceed with logout if already connected to office network
    this.proceedWithLogout();
  }

  private proceedWithLogout(): void {
    this.isLoggingOut.set(true);
    this.cdr.detectChanges();

    // Get server time for accurate logout timestamp
    this.http.get<{ dateTime: string }>('https://timeapi.io/api/time/current/zone?timeZone=Asia/Kolkata').subscribe({
      next: (response) => {
        const serverTime = new Date(response.dateTime).toLocaleTimeString('en-US', {
          hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        this.sendCheckoutData(serverTime);
      },
      error: () => {
        // Fallback to local time if server time API fails
        const localTime = new Date().toLocaleTimeString('en-US', {
          hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        this.sendCheckoutData(localTime);
      }
    });
  }

  private sendCheckoutData(checkoutTime: string, isFallback = false): void {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const token = localStorage.getItem('token');
    const currentSession = this.currentSession();

    if (!userId || !userName || !token || !currentSession?.loginTime) {
      this.isLoggingOut.set(false);
      return;
    }

    // Format date as dd.MM.yyyy (e.g., "07.07.2025")
    const currentDate = this.formatDateToDDMMYYYY(new Date());
    
    // Calculate total working hours
    const totalHours = this.calculateTotalHours(currentSession.loginTime, checkoutTime);

    const payload = {
      id: userId,
      employeeName: userName,
      status: false, // false for checkout
      checkin: currentDate,
      checkout: currentDate,
      totalhours: totalHours
    };

    this.http.post(`https://attendance-three-lemon.vercel.app/checkout`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      timeout(10000) // 10 second timeout to prevent getting stuck
    ).subscribe({
      next: () => {
        // Update local session
        this.currentSession.set({
          ...currentSession,
          logoutTime: checkoutTime
        });
        this.saveSession();
        this.isLoggingOut.set(false);
        this.cdr.detectChanges();
        
        const workingHours = this.getWorkingHours();
        
        if (isFallback) {
          this.toastService.success({
            title: 'Check-out Successful',
            message: `You've checked out at ${checkoutTime} (local time). Total working time: ${workingHours}. Great job today!`,
            duration: 5000
          });
        } else {
          this.toastService.checkOutSuccess(checkoutTime, workingHours);
        }

        console.log('✅ Check-out successful at:', checkoutTime);
      },
      error: (err) => {
        console.error('❌ Backend check-out failed, using localStorage fallback:', err);
        
        // Always reset loading state and proceed with fallback
        this.isLoggingOut.set(false);
        this.handleCheckOutFallback(checkoutTime, isFallback);
      }
    });
  }

  private handleCheckOutFallback(checkoutTime: string, isFallback: boolean): void {
    const currentSession = this.currentSession();
    
    if (currentSession) {
      // Save session locally even if backend fails
      this.currentSession.set({
        ...currentSession,
        logoutTime: checkoutTime
      });
      this.saveSession();
      this.cdr.detectChanges();
      
      const workingHours = this.getWorkingHours();
      
      // Show appropriate toast message
      this.toastService.warning({
        title: 'Check-out Completed (Offline Mode)',
        message: `Checked out at ${checkoutTime}. Total working time: ${workingHours}. Data saved locally - will sync when server is available.`,
        duration: 5000
      });

      console.log('✅ Check-out completed with localStorage fallback at:', checkoutTime);
    }
  }

  // Example methods to demonstrate toast usage
  testToastNotifications(): void {
    // Test different types of toasts
    this.toastService.success('This is a success message!');
    
    setTimeout(() => {
      this.toastService.warning('This is a warning message!');
    }, 1000);
    
    setTimeout(() => {
      this.toastService.info('This is an info message with actions!');
    }, 2000);
    
    setTimeout(() => {
      this.toastService.error({
        title: 'Error with Actions',
        message: 'This error has action buttons',
        actions: [
          {
            label: 'Retry',
            action: () => console.log('Retry clicked'),
            style: 'primary'
          },
          {
            label: 'Dismiss',
            action: () => console.log('Dismiss clicked'),
            style: 'secondary'
          }
        ]
      });
    }, 3000);
  }

  // Test quote refresh with toast
  refreshQuote(): void {
    this.toastService.info('Refreshing inspirational quote...');
    this.loadQuote();
  }

  // Example methods to demonstrate popup usage
  testPopupNotifications(): void {
    // Test different types of popups
    this.popupService.alert({
      title: 'Info Alert',
      message: 'This is an informational alert popup.',
      type: 'info'
    });
  }

  // Test confirmation for a specific action
  testDeleteAction(): void {
    this.popupService.confirm({
      title: 'Delete Confirmation',
      message: 'Are you sure you want to delete this item? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Keep',
      confirmStyle: 'danger'
    }).then((result) => {
      if (result.action === 'confirm') {
        this.toastService.success('Item deleted successfully!');
      }
    });
  }

  // Template Helpers
  getWelcomeMessage(): string {
    const hour = new Date().getHours();
    const employee = this.currentEmployee();
    const name = employee?.name || 'Employee';

    if (hour < 12) return `Good morning, ${name}!`;
    if (hour < 17) return `Good afternoon, ${name}!`;
    return `Good evening, ${name}!`;
  }

  getStatusMessage(): string {
    if (this.isLoggedIn()) {
      return `Working since ${this.lastLoginTime()}`;
    }
    return 'Ready to start your day';
  }

  getStatusText(): string {
    return this.isLoggedIn() ? 'Active' : 'Available';
  }

  getStatusClass(): string {
    return this.isLoggedIn() ? 'status-active' : 'status-inactive';
  }

  // Check if check-in button should be enabled
  isCheckInAvailable(): boolean {
    // Disable if already logged in
    if (this.isLoggedIn()) return false;
    
    // Disable if can't check in today due to restrictions
    if (!this.canCheckInToday()) return false;
    
    // Disable if currently processing login
    if (this.isLoggingIn()) return false;
    
    return true;
  }

  // Check if check-out button should be enabled
  isCheckOutAvailable(): boolean {
    // Must be logged in
    if (!this.isLoggedIn()) return false;
    
    // Must meet minimum time requirement
    if (!this.canLogout()) return false;
    
    // Must not be currently processing logout
    if (this.isLoggingOut()) return false;
    
    return true;
  }

  // Get reason why check-in is not available (for UI feedback)
  getCheckInDisabledReason(): string {
    if (this.isLoggingIn()) return 'Checking in...';
    if (this.isLoggedIn()) return 'Already checked in';
    if (!this.canCheckInToday()) {
      if (this.hasCompletedTodaySession()) {
        return 'Daily attendance completed';
      } else {
        return 'Already checked in today';
      }
    }
    return '';
  }

  // Get reason why check-out is not available (for UI feedback)
  getCheckOutDisabledReason(): string {
    if (this.isLoggingOut()) return 'Checking out...';
    if (!this.isLoggedIn()) return 'Not checked in';
    if (!this.canLogout()) {
      const remaining = this.getTimeUntilLogout();
      return `Wait ${remaining} for minimum work time`;
    }
    return '';
  }

  // Network Status Methods
  isOfficeNetworkConnected(): boolean {
    return this.ipCheckService.isConnectedToOffice();
  }

  getCurrentNetworkIP(): string {
    return this.ipCheckService.getCurrentIP();
  }

  getNetworkServiceStatus(): string {
    return this.ipCheckService.getStatusMessage();
  }

  // Alias methods for template compatibility
  isOfficeWifiConnected(): boolean {
    return this.isOfficeNetworkConnected();
  }

  getWifiStatusClass(): string {
    return this.getNetworkStatusClass();
  }

  getWifiStatusMessage(): string {
    return this.getNetworkStatusMessage();
  }

  refreshWifiStatus(): void {
    this.refreshNetwork();
  }

  refreshNetworkStatus(): void {
    this.refreshNetwork();
  }

  getNetworkStatusMessage(): string {
    const networkState = this.networkStatus();
    if (networkState.checking) return 'Checking network...';
    if (!networkState.isConnected) return 'No internet connection';
    if (networkState.isOfficeNetwork) return 'Connected to office network';
    return `Not on office network. IP: ${networkState.ipAddress}`;
  }

  getNetworkStatusClass(): string {
    const networkState = this.networkStatus();
    if (networkState.checking) return 'network-checking';
    if (!networkState.isConnected) return 'network-offline';
    return networkState.isOfficeNetwork ? 'network-office' : 'network-external';
  }

  // Time and Working Hours Methods
  getTimeUntilLogoutAvailable(): string {
    return this.getTimeUntilLogout();
  }

  getWorkingHoursFormatted(): string {
    return this.getWorkingHours();
  }

  workingHours(): string {
    const session = this.currentSession();
    if (!session?.loginTime) return '0';

    const loginTime = new Date(`${new Date().toDateString()} ${session.loginTime}`);
    const logoutTime = session.logoutTime
      ? new Date(`${new Date().toDateString()} ${session.logoutTime}`)
      : new Date();

    const diffMs = logoutTime.getTime() - loginTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}.${Math.round(minutes / 60 * 10)}`;
  }

  lastLoginTime(): string {
    const session = this.currentSession();
    return session?.loginTime || '';
  }

  lastLogoutTime(): string {
    const session = this.currentSession();
    return session?.logoutTime || '';
  }

  getWorkingHours(): string {
    const session = this.currentSession();
    if (!session?.loginTime) return '0h 0m';

    const loginTime = new Date(`${new Date().toDateString()} ${session.loginTime}`);
    const logoutTime = session.logoutTime
      ? new Date(`${new Date().toDateString()} ${session.logoutTime}`)
      : new Date();

    const diffMs = logoutTime.getTime() - loginTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  }

  getCurrentTime(): string {
    return this.currentTime();
  }

  getCurrentDateString(): string {
    return this.currentDate();
  }

  todayAttendance(): any {
    return {
      loginTime: this.lastLoginTime() || '--:--',
      logoutTime: this.lastLogoutTime() || '--:--',
      status: this.getStatusText(),
      workingHours: this.getWorkingHours()
    };
  }

  shareQuote(): void {
    const quote = this.currentQuote();
    if (quote && navigator.share) {
      navigator.share({
        title: 'Daily Inspiration',
        text: `"${quote.content}" - ${quote.author}`
      }).catch((error) => {
        console.warn('Share failed:', error);
        this.fallbackShareQuote(quote);
      });
    } else if (quote) {
      this.fallbackShareQuote(quote);
    }
  }

  private fallbackShareQuote(quote: Quote): void {
    const text = `"${quote.content}" - ${quote.author}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.toastService.success({
          title: 'Quote Copied!',
          message: 'The inspirational quote has been copied to your clipboard.',
          duration: 3000
        });
      }).catch(() => {
        this.showQuoteDialog(text);
      });
    } else {
      this.showQuoteDialog(text);
    }
  }

  private showQuoteDialog(text: string): void {
    this.popupService.custom({
      title: 'Daily Inspiration',
      html: `
        <div class="quote-dialog">
          <blockquote class="quote-text">${text}</blockquote>
          <p class="quote-instructions">Copy this inspirational quote manually:</p>
          <textarea readonly class="quote-textarea" onclick="this.select()">${text}</textarea>
        </div>
      `,
      buttons: [
        {
          label: 'Close',
          action: () => this.popupService.close('close'),
          style: 'primary'
        }
      ],
      width: '500px',
      customClass: 'quote-popup'
    });
  }

  getMotivationalMessage(): string {
    const messages = [
      'Every expert was once a beginner.',
      'Success is the sum of small efforts repeated.',
      'Progress, not perfection.',
      'Your only limit is your mind.',
      'Dream big, work hard, stay focused.'
    ];
    return messages[new Date().getDate() % messages.length];
  }
}
