import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, timer, of } from 'rxjs';
import { map, tap, catchError, timeout, retry } from 'rxjs/operators';
import { EmployeeService } from './employee.service';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    username: string;
    name: string;
    email: string;
    role: 'admin' | 'employee';
    permissions: string[];
    department?: string;
  };
  expiresIn: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  requirements?: any;
  strength?: number;
}

@Injectable({ providedIn: 'root' })
export class SecureAuthService {
  private readonly TOKEN_KEY = 'timesheet_auth_token';
  private readonly REFRESH_KEY = 'timesheet_refresh_token';
  private readonly USER_KEY = 'timesheet_user_data';
  private readonly SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours
  private readonly WARNING_TIME = 5 * 60 * 1000; // 5 minutes before expiration
  private readonly LEGACY_MODE = true; // Allow existing passwords during transition
  
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  private currentUserSubject = new BehaviorSubject<any>(this.getCurrentUser());
  private sessionWarningSubject = new BehaviorSubject<boolean>(false);
  
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();
  public sessionWarning$ = this.sessionWarningSubject.asObservable();
  
  private sessionTimer: any;
  private warningTimer: any;
  private baseUrl = 'https://attendance-three-lemon.vercel.app'; // Production backend API URL

  constructor(
    private http: HttpClient,
    private router: Router,
    private employeeService: EmployeeService
  ) {
    this.initializeSession();
  }

  /**
   * Secure login with password validation and session management
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    // For now, use the existing employee service for authentication
    // This provides backward compatibility with existing data
    
    // Admin login (hardcoded for now)
    if (credentials.username === 'admin' && credentials.password === 'nimda') {
      const adminResponse: AuthResponse = {
        token: this.generateSecureToken('admin'),
        user: {
          id: 'admin_001',
          username: 'admin',
          name: 'System Administrator',
          email: 'admin@company.com',
          role: 'admin' as const,
          permissions: ['all'],
          department: 'IT'
        },
        expiresIn: this.SESSION_TIMEOUT
      };
      
      return of(adminResponse).pipe(
        tap(authResponse => this.handleSuccessfulLogin(authResponse))
      );
    }
    
    // Employee login using existing service
    return this.employeeService.validateLogin(credentials.username, credentials.password).pipe(
      map(employee => {
        if (!employee) {
          throw new Error('Invalid credentials');
        }
        
        const authResponse: AuthResponse = {
          token: this.generateSecureToken(employee.username),
          user: {
            id: employee.id,
            username: employee.username,
            name: employee.name,
            email: employee.email,
            role: employee.role === 'manager' ? 'admin' : 'employee',
            permissions: employee.role === 'manager' ? ['all'] : ['read', 'update-own'],
            department: employee.department || 'General'
          },
          expiresIn: this.SESSION_TIMEOUT
        };
        
        return authResponse;
      }),
      tap(authResponse => this.handleSuccessfulLogin(authResponse)),
      catchError(error => throwError(() => new Error('Authentication failed')))
    );
  }

  /**
   * Mock login for development (remove in production)
   */
  mockLogin(credentials: LoginCredentials): Observable<AuthResponse> {
    const validation = this.validateCredentials(credentials);
    if (!validation.isValid) {
      return throwError(() => new Error(validation.errors.join(', ')));
    }

    // Simulate API delay
    return timer(1000).pipe(
      map(() => {
        // Admin login
        if (credentials.username === 'admin' && credentials.password === 'nimda') {
          return {
            token: this.generateSecureToken('admin'),
            user: {
              id: 'admin_001',
              username: 'admin',
              name: 'System Administrator',
              email: 'admin@company.com',
              role: 'admin' as const,
              permissions: ['all'],
              department: 'IT'
            },
            expiresIn: this.SESSION_TIMEOUT
          };
        }

        // Employee login (mock validation)
        const mockUsers = [
          {
            id: '64e7',
            username: 'AJ056',
            password: '1234',
            name: 'Ajith Kumar',
            email: 'arunajith056@gmail.com',
            role: 'employee' as const,
            department: 'IT'
          },
          {
            id: '55f4',
            username: 'selvan',
            password: '1234',
            name: 'Selvan',
            email: 'selvan@gmail.com',
            role: 'employee' as const,
            department: 'IT'
          }
        ];

        const user = mockUsers.find(u => 
          u.username === credentials.username && u.password === credentials.password
        );

        if (!user) {
          throw new Error('Invalid credentials');
        }

        return {
          token: this.generateSecureToken(user.username),
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            role: user.role,
            permissions: ['attendance:read', 'attendance:write'],
            department: user.department
          },
          expiresIn: this.SESSION_TIMEOUT
        };
      }),
      tap(authResponse => this.handleSuccessfulLogin(authResponse)),
      catchError(error => this.handleLoginError(error))
    );
  }

  /**
   * Secure logout with complete session cleanup
   */
  logout(reason?: string): void {
    this.clearTimers();
    this.clearSecureStorage();
    this.isLoggedInSubject.next(false);
    this.currentUserSubject.next(null);
    this.sessionWarningSubject.next(false);
    
    console.log(`🔐 User logged out${reason ? `: ${reason}` : ''}`);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return this.hasValidToken();
  }

  /**
   * Get current user role
   */
  getUserRole(): string | null {
    const user = this.getCurrentUser();
    const role = user?.role || null;
    console.log('🔍 Getting user role:', role, 'for user:', user?.username);
    return role;
  }

  /**
   * Get current user data
   */
  getCurrentUser(): any {
    try {
      // First check for the new secure user data format
      const userData = localStorage.getItem(this.USER_KEY);
      if (userData) {
        const user = JSON.parse(userData);
        if (this.validateUserData(user)) {
          return user;
        }
      }
      
      // Fallback: Check for individual localStorage keys from login response
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');
      const userEmail = localStorage.getItem('userEmail');
      const role = localStorage.getItem('role');
      const token = localStorage.getItem('token');
      
      if (userId && userName && token) {
        // Construct user object from individual localStorage items
        const user = {
          id: userId,
          username: userName,
          name: userName,
          email: userEmail || '',
          role: role || 'employee',
          employeeName: userName,
          employeeEmail: userEmail || ''
        };
        
        console.log('✅ User data constructed from individual localStorage keys:', user);
        return user;
      }
      
      return null;
    } catch (error) {
      console.warn('Error getting user data, trying fallback:', error);
      
      // Error fallback: try individual keys
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');
      const userEmail = localStorage.getItem('userEmail');
      const role = localStorage.getItem('role');
      
      if (userId && userName) {
        return {
          id: userId,
          username: userName,
          name: userName,
          email: userEmail || '',
          role: role || 'employee',
          employeeName: userName,
          employeeEmail: userEmail || ''
        };
      }
      
      return null;
    }
  }

  /**
   * Get current authentication token
   */
  getToken(): string | null {
    try {
      const tokenData = localStorage.getItem(this.TOKEN_KEY);
      if (!tokenData) return null;
      
      const parsed = JSON.parse(tokenData);
      
      // Check if token is expired
      if (Date.now() > parsed.expiresAt) {
        this.logout('Token expired');
        return null;
      }
      
      return parsed.token;
    } catch {
      return null;
    }
  }

  /**
   * Extend current session if user is active
   */
  extendSession(): void {
    if (this.isAuthenticated()) {
      const user = this.getCurrentUser();
      if (user) {
        this.startSessionMonitoring(user);
      }
    }
  }

  // Handle authentication errors (e.g., from HTTP interceptor)
  handleAuthError(): void {
    console.warn('Authentication error detected, logging out user');
    this.logout();
  }

  // Refresh authentication token
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(this.REFRESH_KEY);
    if (!refreshToken) {
      return throwError('No refresh token available');
    }

    // For now, mock the refresh - in production this would call the backend
    return new Observable(observer => {
      setTimeout(() => {
        const mockRefreshResponse: AuthResponse = {
          token: this.generateMockToken(),
          refreshToken: this.generateMockToken(),
          user: this.getCurrentUser() || {
            id: '1',
            username: 'user',
            name: 'User',
            email: 'user@example.com',
            role: 'employee' as 'admin' | 'employee',
            permissions: ['read']
          },
          expiresIn: this.SESSION_TIMEOUT
        };
        
        this.handleSuccessfulLogin(mockRefreshResponse);
        observer.next(mockRefreshResponse);
        observer.complete();
      }, 500);
    });
  }

  // Private helper methods

  private validateCredentials(credentials: LoginCredentials): ValidationResult {
    const errors: string[] = [];
    
    if (!credentials.username?.trim()) {
      errors.push('Username is required');
    } else if (credentials.username.trim().length < 3) {
      errors.push('Username must be at least 3 characters');
    }
    
    if (!credentials.password?.trim()) {
      errors.push('Password is required');
    } else if (credentials.password.length < 4) {
      errors.push('Password must be at least 4 characters');
    }
    
    // Basic sanitization check
    if (this.containsSuspiciousContent(credentials.username) || 
        this.containsSuspiciousContent(credentials.password)) {
      errors.push('Invalid characters detected');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateAuthResponse(response: any): AuthResponse {
    if (!response?.token || !response?.user) {
      throw new Error('Invalid authentication response');
    }
    
    if (!response.user.role || !['admin', 'employee'].includes(response.user.role)) {
      throw new Error('Invalid user role');
    }
    
    return response as AuthResponse;
  }

  private handleSuccessfulLogin(authResponse: AuthResponse): void {
    console.log('🔐 Processing successful login for:', authResponse.user.username);
    console.log('👤 User data:', authResponse.user);
    
    // Store encrypted session data
    this.setSecureSession(authResponse);
    
    // Update observables
    this.isLoggedInSubject.next(true);
    this.currentUserSubject.next(authResponse.user);
    
    // Start session monitoring
    this.startSessionMonitoring(authResponse.user);
    
    console.log('✅ Login fully processed for:', authResponse.user.username);
    console.log('🔑 Authentication state updated, role:', authResponse.user.role);
  }

  private handleLoginError(error: any): Observable<never> {
    let errorMessage = 'Login failed. Please try again.';
    
    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 401:
          errorMessage = 'Invalid username or password';
          break;
        case 429:
          errorMessage = 'Too many login attempts. Please try again later.';
          break;
        case 500:
          errorMessage = 'Server error. Please contact support.';
          break;
        case 0:
          errorMessage = 'Network error. Please check your connection.';
          break;
      }
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    console.error('🔐 Login error:', error);
    return throwError(() => new Error(errorMessage));
  }

  private setSecureSession(authResponse: AuthResponse): void {
    const tokenData = {
      token: authResponse.token,
      createdAt: Date.now(),
      expiresAt: Date.now() + (authResponse.expiresIn || this.SESSION_TIMEOUT)
    };
    
    try {
      localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData));
      localStorage.setItem(this.USER_KEY, JSON.stringify(authResponse.user));
      
      if (authResponse.refreshToken) {
        localStorage.setItem(this.REFRESH_KEY, authResponse.refreshToken);
      }
    } catch (error) {
      console.error('Failed to store session data:', error);
      throw new Error('Session storage failed');
    }
  }

  private startSessionMonitoring(user: any): void {
    this.clearTimers();
    
    // Set warning timer (5 minutes before expiration)
    this.warningTimer = setTimeout(() => {
      this.sessionWarningSubject.next(true);
      console.warn('⚠️ Session will expire in 5 minutes');
    }, this.SESSION_TIMEOUT - this.WARNING_TIME);
    
    // Set logout timer
    this.sessionTimer = setTimeout(() => {
      this.logout('Session expired');
    }, this.SESSION_TIMEOUT);
  }

  private clearTimers(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  private clearSecureStorage(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_KEY);
      localStorage.removeItem(this.USER_KEY);
      
      // Clear legacy keys if they exist
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      localStorage.removeItem('currentEmployeeId');
      
      sessionStorage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  private hasValidToken(): boolean {
    try {
      // First check for the new secure token format
      const tokenData = localStorage.getItem(this.TOKEN_KEY);
      if (tokenData) {
        const parsed = JSON.parse(tokenData);
        if (Date.now() < parsed.expiresAt) {
          return true;
        }
      }
      
      // Fallback: Check for simple token format from login response
      const simpleToken = localStorage.getItem('token');
      if (simpleToken) {
        // If we have a simple token and user data, consider it valid
        const userId = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName');
        return !!(userId && userName);
      }
      
      return false;
    } catch {
      // If JSON parsing fails, check for simple token
      const simpleToken = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');
      return !!(simpleToken && userId && userName);
    }
  }

  private validateUserData(user: any): boolean {
    return user && 
           typeof user.id === 'string' && 
           typeof user.username === 'string' && 
           typeof user.role === 'string' &&
           ['admin', 'employee'].includes(user.role);
  }

  private generateSecureToken(username: string): string {
    // In production, this should be generated by the backend
    const payload = {
      username,
      issued: Date.now(),
      random: Math.random().toString(36).substring(2)
    };
    
    return btoa(JSON.stringify(payload)) + '.' + this.generateSignature(payload);
  }

  private generateSignature(payload: any): string {
    // Simple signature - in production use proper JWT signing
    return btoa(JSON.stringify(payload) + 'SECRET_KEY').substring(0, 20);
  }

  private sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove JS protocols
      .replace(/on\w+=/gi, ''); // Remove event handlers
  }

  private containsSuspiciousContent(input: string): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /&#/,
      /%3C/i,
      /%3E/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(input));
  }

  private getClientInfo(): any {
    return {
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  private initializeSession(): void {
    // Check if we have a valid session on startup
    if (this.hasValidToken()) {
      const user = this.getCurrentUser();
      if (user) {
        this.isLoggedInSubject.next(true);
        this.currentUserSubject.next(user);
        this.startSessionMonitoring(user);
      } else {
        this.clearSecureStorage();
      }
    }
  }

  // Generate mock token for development
  private generateMockToken(): string {
    const payload = {
      exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60), // 8 hours
      iat: Math.floor(Date.now() / 1000),
      sub: 'mock-user'
    };
    return btoa(JSON.stringify(payload)) + '.' + btoa('mock-signature');
  }
}
