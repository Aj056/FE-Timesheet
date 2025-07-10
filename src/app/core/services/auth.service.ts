import { Injectable, inject } from "@angular/core";
import { Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { ValidationService } from "./validation.service";
import { environment } from "../../../environments/environment";

export interface Employee {
  id: string;
  name?: string;
  employeeName?: string;
  email?: string;
  employeeEmail?: string;
  username: string;
  password: string;
  role: string;
  department?: string;
  status?: string;
  joiningDate?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: Employee;
  token?: string;
  message?: string;
}

@Injectable({providedIn:'root'})
export class Authservice{
    private readonly http = inject(HttpClient);
    private readonly validationService = inject(ValidationService);
    private readonly baseUrl = environment.apiUrl;
    
    constructor(private router: Router){}

    // Main login method
    login(username: string, password: string): Observable<LoginResponse> {
        console.log('🔐 Login attempt for username:', username);
        
        return this.authenticateUser(username, password).pipe(
            map(response => {
                if (response.success && response.user && response.token) {
                    this.storeAuthData(response);
                    console.log('✅ Login successful');
                }
                return response;
            }),
            catchError(error => {
                console.error('🚨 Login error:', error);
                return of({ success: false, message: 'Login failed due to service error' });
            })
        );
    }

    // Core authentication method - exposed for testing
    authenticateUser(username: string, password: string): Observable<LoginResponse> {
        // Validate credentials format
        const validation = this.validationService.validateCredentials(username, password);
        if (!validation.isValid) {
            return of({
                success: false,
                message: `Invalid credential format: ${validation.errors.join(', ')}`
            });
        }
        
        const loginData = { username, password };
        console.log('🔍 Sending login request to:', `${this.baseUrl}/login`);
        
        return this.http.post<any>(`${this.baseUrl}/login`, loginData).pipe(
            map(response => this.processLoginResponse(response)),
            catchError(error => this.handleAuthError(error, username))
        );
    }

    // Process backend login response
    private processLoginResponse(response: any): LoginResponse {
        console.log('📊 Backend response:', response);
        
        if (response.token?.tokens && response.data) {
            const userData = response.data;
            const mappedUser: Employee = {
                id: userData._id || userData.id,
                name: userData.employeeName || userData.name || userData.username,
                employeeName: userData.employeeName || userData.name || userData.username,
                email: userData.employeeEmail || userData.email || '',
                employeeEmail: userData.employeeEmail || userData.email || '',
                username: userData.username,
                password: '',
                role: userData.role || 'employee',
                department: userData.department || 'General',
                status: userData.status || 'active',
                joiningDate: userData.joiningDate
            };
            
            return {
                success: true,
                user: mappedUser,
                token: response.token.tokens,
                message: response.message || 'Login successful'
            };
        }
        
        return {
            success: false,
            message: response.message || 'Invalid credentials'
        };
    }

    // Handle authentication errors
    private handleAuthError(error: any, username: string): Observable<LoginResponse> {
        console.error('🚨 Auth error:', error);
        
        const errorMessages = {
            0: 'Unable to connect to server. Please check your connection.',
            400: 'Invalid request format. Please check your credentials.',
            401: `Invalid username '${username}' or password.`,
            404: 'Login service not found. Please contact administrator.',
            500: 'Server error. Please try again later.'
        };
        
        const message = errorMessages[error.status as keyof typeof errorMessages] || 
                       'Authentication service temporarily unavailable.';
        
        return of({ success: false, message });
    }

    // Store authentication data in localStorage
    private storeAuthData(response: LoginResponse): void {
        if (!response.user || !response.token) return;
        
        const role = this.determineUserRole(response.user);
        const authData = {
            token: response.token,
            role: role,
            userId: response.user.id,
            username: response.user.username,
            userEmail: response.user.email || response.user.employeeEmail || '',
            userName: response.user.name || response.user.employeeName || ''
        };
        
        Object.entries(authData).forEach(([key, value]) => {
            localStorage.setItem(key, value);
        });
        
        console.log('💾 Auth data stored');
    }

    // Determine user role
    private determineUserRole(user: Employee): string {
        const role = user.role.toLowerCase();
        return (role.includes('admin') || role.includes('manager') || user.username.toLowerCase() === 'admin') 
               ? 'admin' 
               : 'employee';
    }

    // Logout user
    logout(): Observable<any> {
        console.log('🚪 Logout initiated');
        this.clearAuthData();
        
        // Optional: notify backend (fire and forget)
        const token = localStorage.getItem('token');
        if (token) {
            this.http.post(`${this.baseUrl}/logout`, {}).pipe(
                catchError(() => of(null))
            ).subscribe();
        }
        
        return of({ success: true, message: 'Logged out successfully' });
    }

    // Clear all authentication data
    private clearAuthData(): void {
        const authKeys = ['token', 'role', 'userId', 'username', 'userEmail', 'userName', 'user', 'refreshToken'];
        authKeys.forEach(key => localStorage.removeItem(key));
        console.log('🧹 Auth data cleared');
    }

    // Auth state getters
    isLoggedIN(): boolean {
        return !!(localStorage.getItem('token') && localStorage.getItem('role'));
    }

    getuserrole(): string | null {
        return localStorage.getItem('role');
    }

    getCurrentUserId(): string | null {
        return localStorage.getItem('userId');
    }

    getCurrentUsername(): string | null {
        return localStorage.getItem('username');
    }

    getCurrentUserEmail(): string | null {
        return localStorage.getItem('userEmail');
    }

    getCurrentUserName(): string | null {
        return localStorage.getItem('userName');
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    // Validation helpers
    getCredentialValidationMessage(username: string, password: string): string {
        return this.validationService.getLoginValidationMessage(username, password);
    }

    validateCredentialsFormat(username: string, password: string): { isValid: boolean; message: string } {
        const validation = this.validationService.validateCredentials(username, password);
        return validation.isValid 
               ? { isValid: true, message: 'Credentials format is valid' }
               : { isValid: false, message: `Please fix: ${validation.errors.join(', ')}` };
    }
}