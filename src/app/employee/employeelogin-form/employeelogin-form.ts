import { Component, OnInit, OnDestroy, ChangeDetectorRef, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
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
    // First, try to get stored user data
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (stored && token ) {
      // Parse stored employee data
      const employee = JSON.parse(stored);
      this.currentEmployee.set({
        id: employee._id || employee.id,
        name: employee.employeeName || employee.name,
        username: employee.username
      });
      
      // Optionally verify token is still valid and fetch fresh data
      // this.verifyAndRefreshEmployeeData(token);
    } else {
      // No stored data, set default and redirect to login
      this.currentEmployee.set({
        id: 'guest',
        name: 'Guest User',
        username: 'guest'
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
    this.http.get<any>('http://localhost:1002/all', {
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
    // Clear invalid token and user data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
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
      this.cdr.markForCheck(); // Trigger change detection for zoneless
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
  }

  // Network Management - using IpCheckService
  private initializeNetworkService(): void {
    // Subscribe to network status changes
    const networkSub = this.ipCheckService.networkStatus$.subscribe(status => {
      this.networkStatus.set(status);
      this.cdr.markForCheck(); // Trigger change detection for zoneless
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
        this.cdr.markForCheck(); // Trigger change detection
      },
      error: () => {
        this.currentQuote.set({
          content: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
          author: "Winston Churchill"
        });
        this.isQuoteLoading.set(false);
        this.cdr.markForCheck(); // Trigger change detection
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

  // Main Actions
  employee_login(): void {
    // Prevent multiple concurrent login attempts
    if (this.isLoggingIn()) {
      return;
    }

    // Check if already logged in
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
    this.cdr.markForCheck();

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

    const payload = {
      id: userId,
      employeeName: userName,
      status: true,
      checkin:serverTime,
      checkout: null,
      totalhours: null
    };

    this.http.post(`http://192.168.29.198:1001/checkin`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: () => {
        this.saveSession();
        this.isLoggingIn.set(false);
        this.currentSession.set({
          loginTime: serverTime,
          date: new Date().toDateString()
        });
        this.cdr.markForCheck();

        if (isFallback) {
          this.toastService.success({
            title: 'Check-in Successful',
            message: `You've checked in at ${serverTime} (local time).`,
            duration: 4000
          });
        } else {
          this.toastService.checkInSuccess(serverTime);
        }

        console.log('✅ Check-in successful at:',serverTime);
      },
      error: (err) => {
        console.error('❌ Failed to log check-in to backend', err);
      }
    });
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
    this.cdr.markForCheck();

    // Get server time for accurate logout timestamp
    this.http.get<{ dateTime: string }>('https://timeapi.io/api/time/current/zone?timeZone=Asia/Kolkata').subscribe({
      next: (response) => {
        const serverTime = new Date(response.dateTime).toLocaleTimeString('en-US', {
          hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        const currentSession = this.currentSession();
        if (currentSession) {
          this.currentSession.set({
            ...currentSession,
            logoutTime: serverTime
          });
          this.saveSession();
        }
        this.isLoggingOut.set(false);
        this.cdr.markForCheck();
        
        const workingHours = this.getWorkingHours();
        this.toastService.checkOutSuccess(serverTime, workingHours);
      },
      error: () => {
        // Fallback to local time if server time API fails
        const localTime = new Date().toLocaleTimeString('en-US', {
          hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        const currentSession = this.currentSession();
        if (currentSession) {
          this.currentSession.set({
            ...currentSession,
            logoutTime: localTime
          });
          this.saveSession();
        }
        this.isLoggingOut.set(false);
        this.cdr.markForCheck();
        
        const workingHours = this.getWorkingHours();
        this.toastService.success({
          title: 'Check-out Successful',
          message: `You've checked out at ${localTime} (using local time). Total working time: ${workingHours}. Great job today!`,
          duration: 5000
        });
      }
    });
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
