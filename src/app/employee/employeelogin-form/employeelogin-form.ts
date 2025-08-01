import { Component, OnInit, OnDestroy, ChangeDetectorRef, signal, ViewEncapsulation, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { ToastService } from '../../core/services/toast.service';
import { PopupService } from '../../core/services/popup.service';
import { IpCheckService } from '../../core/services/ip-check.service';
import { Employee, AttendanceSession, Quote, OfficeNetworkStatus } from '../../core/interfaces/common.interfaces';
import { EmployeeDataService } from '../../core/services/checkin-Employee/get-employee.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormatTimePipe } from '../../core/pipes/timeFormat.pipe';

@Component({
  selector: 'app-employeelogin-form',
  standalone: true,
  imports: [CommonModule, FormatTimePipe],
  templateUrl: './employeelogin-form.html',
  styleUrls: ['./employeelogin-form-clean.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EmployeeloginFormComponent implements OnInit, OnDestroy {
  private service = inject(EmployeeDataService);
  private destroyRef = inject(DestroyRef);
  // Core data - using signals for zoneless
  currentEmployee = signal<Employee | null>(null);
  currentSession = signal<AttendanceSession | null>(null);///need to be removed
  currentTime = signal<string>('');
  currentDate = signal<string>('');
  isApiLoaded = signal<boolean>(false);
  // Status - using signals
  isLoggingIn = signal(false);
  isLoggingOut = signal(false);
  isSyncing = signal(false);
  networkStatus = signal<OfficeNetworkStatus>({ isConnected: false, isOfficeNetwork: false, ipAddress: '', checking: false });
  currentQuote = signal<Quote | null>(null);
  isQuoteLoading = signal(false);
  lastSyncTime = signal<string | null>(null);

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
    const userId: string = localStorage.getItem('userId') ?? '';
    this.service.getEmployeeDetailWithID(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: any) => {
        this.currentEmployee.set({
          _id: userId,
          employeeName: res.employeeName,
          employeeEmail: res.employeeEmail || '',
          username: res.employeeEmail || res.employeeName,
          role: res.role,
          status: res.status,
          timelog: res.timelog
        });
        this.loadStoredAttendanceStatus(res);
        this.isApiLoaded.set(true)
      })

  }

  private loadStoredAttendanceStatus(empData: any): void {
    const storedStatus = empData?.status;
    const userEmployeeData = empData;

    if (storedStatus !== null) {
      const isCheckedIn = storedStatus === 'true';
      console.log('📊 Loaded attendance status from /allemp API:', isCheckedIn);

      // Log user details if available
      if (userEmployeeData) {
        try {
          const userData = JSON.parse(userEmployeeData);
          console.log('👤 Current user data from /allemp:', {
            id: userData._id,
            name: userData.employeeName,
            username: userData.username,
            status: userData.status
          });
        } catch (e) {
          console.log('⚠️ Could not parse user employee data');
        }
      }

      if (isCheckedIn) {
        // User is currently checked in according to /allemp API - restore session
        console.log('✅ User is already checked in according to /allemp - syncing session');

        // Create/restore local session to match stored status
        const today = new Date().toDateString();
        const existingSession = localStorage.getItem(`session_${today}`);

        if (!existingSession) {
          // Restore session - use current time as estimate since we don't have exact check-in time
          const estimatedLoginTime = new Date().toLocaleTimeString('en-US', {
            hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit'
          });

          this.currentSession.set({
            loginTime: estimatedLoginTime,
            date: today,
            // checkinDateTime: new Date().toISOString() // Use current time as estimate
          });
          this.saveSession();

          this.toastService.info({
            title: 'Session Restored',
            message: 'Your attendance status has been synchronized from the server.',
            duration: 4000
          });
        }
      } else {
        // User is not checked in according to /allemp status
        console.log('ℹ️ User is not checked in according to /allemp - ready for check-in');

        // Clear any stale local session that doesn't match stored status
        const today = new Date().toDateString();
        const existingSession = localStorage.getItem(`session_${today}`);
        if (existingSession) {
          const session = JSON.parse(existingSession);
          if (session.loginTime && !session.logoutTime) {
            // We have a local check-in session but /allemp says not checked in
            console.log('⚠️ Local session mismatch with /allemp status - clearing stale session');
            this.currentSession.set(null);
            localStorage.removeItem(`session_${today}`);

            this.toastService.warning({
              title: 'Session Synchronized',
              message: 'Your session has been synchronized with the server status.',
              duration: 3000
            });
          }
        }
      }
    } else {
      // No stored status from /allemp, default to false
      console.log('ℹ️ No attendance status from /allemp - defaulting to ready for check-in');
      localStorage.setItem('currentAttendanceStatus', 'false');
    }
  }

  // Method to refresh session data from backend (manual refresh only)
  refreshSessionFromBackend(): void {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    if (userId && token) {
      this.isSyncing.set(true);
      this.toastService.info('Syncing with server...');
      // Use /allemp endpoint for consistency with login flow
      this.fetchAndUpdateAttendanceStatus(userId, token);
    } else {
      this.toastService.warning('Please login to sync with server.');
    }
  }

  // Fetch current user status from /allemp API (for manual refresh)
  private fetchAndUpdateAttendanceStatus(userId: string, token: string): void {
    console.log('🔄 Manual refresh: Fetching status from /allemp for user:', userId);

    this.http.get<any>('https://attendance-three-lemon.vercel.app/allemp', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (response) => {
        this.isSyncing.set(false);
        this.lastSyncTime.set(new Date().toLocaleTimeString('en-US', {
          hour12: true, hour: '2-digit', minute: '2-digit'
        }));

        console.log('📊 /allemp response (manual refresh):', response);

        if (response.data && Array.isArray(response.data)) {
          const currentUser = response.data.find((emp: any) => emp._id === userId);

          if (currentUser) {
            const previousStatus = localStorage.getItem('currentAttendanceStatus');
            const newStatus = currentUser.status.toString();

            localStorage.setItem('currentAttendanceStatus', newStatus);
            localStorage.setItem('currentUserEmployeeData', JSON.stringify(currentUser));

            console.log('✅ Status refreshed from /allemp:', {
              userId: userId,
              username: currentUser.username,
              previousStatus: previousStatus,
              newStatus: newStatus,
              name: currentUser.employeeName
            });

            if (newStatus === 'true') {
              // User is currently checked in - restore session
              const today = new Date().toDateString();
              const existingSession = localStorage.getItem(`session_${today}`);

              if (!existingSession) {
                const estimatedLoginTime = new Date().toLocaleTimeString('en-US', {
                  hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit'
                });

                this.currentSession.set({
                  loginTime: estimatedLoginTime,
                  date: today,
                  // checkinDateTime: new Date().toISOString() // Use current time as estimate
                });
                this.saveSession();
              }

              this.toastService.success({
                title: 'Status Synced',
                message: 'You are currently checked in. Session has been synchronized.',
                duration: 3000
              });
            } else {
              // User is not checked in - clear any stale session
              const today = new Date().toDateString();
              const existingSession = localStorage.getItem(`session_${today}`);
              if (existingSession) {
                this.currentSession.set(null);
                localStorage.removeItem(`session_${today}`);
              }

              this.toastService.info({
                title: 'Status Synced',
                message: 'You are not currently checked in.',
                duration: 3000
              });
            }
          } else {
            this.toastService.warning({
              title: 'Sync Failed',
              message: 'User not found in employee records.',
              duration: 3000
            });
          }
        } else {
          this.toastService.error({
            title: 'Sync Failed',
            message: 'Invalid response from server.',
            duration: 3000
          });
        }
      },
      error: (error) => {
        this.isSyncing.set(false);
        console.error('🚨 Error refreshing from /allemp:', error);
        this.toastService.error({
          title: 'Sync Failed',
          message: 'Could not connect to server. Please try again.',
          duration: 3000
        });
      }
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
    // this.cachedTimeUntilLogout.set(this.calculateTimeUntilLogout());
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
    return this.currentEmployee()?.status ?? false;
  }

canLogout(): boolean {
    if (!this.currentEmployee()?.status) return false;
    const session = this.currentEmployee();
    const checkInTime = session?.timelog?.length ? session?.timelog[0]?.checkin : '';
    if (!checkInTime) return false;

    return (checkInTime&& this.currentEmployee()?.status) ? true : false;
  }

  getTimeUntilLogout(): string {
    return this.cachedTimeUntilLogout();
  }

  // private calculateTimeUntilLogout(): string {
  //   const session = this.currentSession();
  //   // if (!session?.checkinDateTime) return '';

  //   // Use the actual check-in datetime for accurate countdown
  //   // const loginTime = new Date(session.checkinDateTime);
  //   const now = new Date();
  //   // const timeDiff = now.getTime() - loginTime.getTime();
  //   const thirtySeconds = 30 * 1000; // 30 seconds in milliseconds
  //   // const remaining = thirtySeconds - timeDiff;

  //   // if (remaining <= 0) return '';

  //   // const seconds = Math.floor(remaining / 1000);
  //   // return `${seconds}s`;
  // }

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
    const session = this.currentSession();
    if (!session) return true; // No session today, can check in

    // If there's a session but no logout, user is still checked in
    if (session.loginTime && !session.logoutTime) {
      return false; // Already checked in
    }

    // If user has completed a session (both login and logout), check 1-hour restriction
    // if (session.loginTime && session.logoutTime && session.checkoutDateTime) {
    //   const checkoutTime = new Date(session.checkoutDateTime);
    //   const now = new Date();
    //   const timeDiff = now.getTime() - checkoutTime.getTime();
    //   const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

    //   return timeDiff >= oneHour; // Can check in only after 1 hour
    // }

    // If session exists but no checkout datetime, allow check-in (legacy sessions)
    return session.loginTime != null && session.logoutTime != null;
  }

  // Get time remaining until next check-in is allowed
  // getTimeUntilNextCheckIn(): string {
  //   const session = this.currentSession();
  //   if (!session?.checkoutDateTime) return '';

  //   const checkoutTime = new Date(session.checkoutDateTime);
  //   const now = new Date();
  //   const timeDiff = now.getTime() - checkoutTime.getTime();
  //   const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
  //   const remaining = oneHour - timeDiff;

  //   if (remaining <= 0) return '';

  //   const minutes = Math.floor(remaining / (1000 * 60));
  //   const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  //   if (minutes > 0) {
  //     return `${minutes}m ${seconds}s`;
  //   } else {
  //     return `${seconds}s`;
  //   }
  // }

  // Method to refresh session data from backend - moved above to use /allemp API

  // Main Actions
  employee_login(): void {
    // Show confirmation popup for check-in
    this.popupService.attendanceConfirm('checkin', 'Are you ready to start your work session?').then((result) => {
      if (result.action === 'confirm') {
        this.proceedWithNetworkCheck();
      }
    }).catch((error) => {
      console.error('❌ Check-in confirmation error:', error);
      this.toastService.error({
        title: 'System Error',
        message: 'Unable to show check-in confirmation. Please try again.',
        duration: 4000
      });
    });
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

    // Backend now handles time logic, so directly call sendCheckinData
    this.sendCheckinData();
  }

  //send data to backend
  private sendCheckinData(): void {
    // Backend now handles time logic, so only send employee ID
    const payload = { id: this.currentEmployee()?._id || '' };
    
    this.http.post(`https://attendance-three-lemon.vercel.app/checkin`, payload).pipe(
      takeUntilDestroyed(this.destroyRef),
      timeout(10000) // 10 second timeout to prevent getting stuck
    ).subscribe({
      next: (response: any) => {
        this.loadEmployee();
        // Check if response is successful
        if (response && (response.msg || response.message)) {
          const loginTime = new Date().toLocaleTimeString('en-US', {
            hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit'
          });

          // Store the attendance record ID from check-in response for checkout
          const attendanceId = response?.data?._id || response?._id;

          this.saveSession();
          this.isLoggingIn.set(false);
          this.cdr.detectChanges();

          this.toastService.success({
            title: 'Check-in Successful',
            message: `You've checked in at ${loginTime}.`,
            duration: 4000
          });

          console.log('✅ Check-in successful at:', loginTime);
        } 
      },
      error: (err) => {
        console.error('❌ Backend check-in failed:', err);
        this.isLoggingIn.set(false);
        this.cdr.detectChanges();
      }
    });
  }


  employee_logout(): void {
    // Prevent multiple concurrent logout attempts
    if (this.isLoggingOut()) {
      return;
    }

    // Check if user is logged in
    if (!this.currentEmployee()?.status) {
      this.toastService.warning('You are not currently checked in.');
      return;
    }

    // Check if minimum time requirement is met
    if (!this.canLogout()) {
      const remaining = this.getTimeUntilLogout();
      this.toastService.minimumTimeWarning(remaining);
      return;
    }

    this.popupService.attendanceConfirm('checkout', `Current working time: `).then((result) => {
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
    
    // Backend now handles time logic, so only send employee ID
    const payload = { id: this.currentEmployee()?._id || '' };
    this.sendCheckoutData(payload);
  }

  private sendCheckoutData(payload: any): void {
    // Use the attendance ID from check-in response for checkout endpoint
    this.http.post(`https://attendance-three-lemon.vercel.app/checkout`, payload).pipe(
      takeUntilDestroyed(this.destroyRef),
      timeout(10000) // 10 second timeout to prevent getting stuck
    ).subscribe({
      next: (response) => {
        this.loadEmployee();
        // Update local session with checkout datetime for 1-hour restriction
        this.currentSession.set(response as AttendanceSession);
        this.saveSession();
        this.isLoggingOut.set(false);
        this.cdr.detectChanges();

        const logoutTime = new Date().toLocaleTimeString('en-US', {
          hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        this.toastService.success({
          title: 'Check-out Successful',
          message: `You've checked out at ${logoutTime}.`,
          duration: 4000
        });

        console.log('✅ Check-out successful at:', logoutTime);
      },
      error: (err) => {
        if(err.status === 403 ){
          this.toastService.warning({
            title: 'Access Denied',
            message: err.error.message,
            duration: 5000
          });
          this.isLoggingOut.set(false);
        }
        console.error('❌ Backend check-out failed:', err);
        this.isLoggingOut.set(false);
        this.cdr.detectChanges();
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
    const localData = JSON.parse(localStorage.getItem('currentUserEmployeeData') || '{}');
    const hour = new Date().getHours();
    const employee = this.currentEmployee();
    const name = employee?.employeeName || localData?.employeeName || 'Employee';

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
      // if (this.hasCompletedTodaySession()) {
      //   const timeRemaining = this.getTimeUntilNextCheckIn();
      //   if (timeRemaining) {
      //     return `Wait ${timeRemaining} before next check-in`;
      //   } else {
      //     return 'Daily attendance completed';
      //   }
      // } else {
      //   return 'Already checked in today';
      // }
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

 

  // workingHours(): string {
  //   const session = this.currentSession();
  //   // if (!session?.checkinDateTime) return '0';

  //   // Use actual check-in datetime for accurate calculation
  //   const loginTime = new Date(session.checkinDateTime);
  //   const logoutTime = session.logoutTime
  //     ? new Date(`${new Date().toDateString()} ${session.logoutTime}`)
  //     : new Date();

  //   const diffMs = logoutTime.getTime() - loginTime.getTime();
  //   const hours = Math.floor(diffMs / (1000 * 60 * 60));
  //   const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  //   return `${hours}.${Math.round(minutes / 60 * 10)}`;
  // }

  lastLoginTime(): string {
    const session = this.currentSession();
    return session?.loginTime || '';
  }

  lastLogoutTime(): string {
    const session = this.currentSession();
    return session?.logoutTime || '';
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
