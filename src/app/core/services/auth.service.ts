import { Injectable, inject } from "@angular/core";
import { Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { ValidationService } from "./validation.service";
import { environment } from "../../../environments/environment";
import { Employee, LoginResponse, LoginCredentials, ValidationResult } from "../interfaces/common.interfaces";

/**
 * Streamlined Authentication Service
 * Handles login, logout, and basic auth state management
 */
@Injectable({providedIn:'root'})
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly validationService = inject(ValidationService);
    private readonly baseUrl = environment.apiUrl;
    
    constructor(private router: Router) {}

    /**
     * Main login method with simplified flow
     */
    login(credentials: LoginCredentials): Observable<LoginResponse> {
        console.log('🔐 Login attempt for username:', credentials.username);
        
        // Validate credentials format
        const validation = this.validationService.validateCredentials(credentials.username, credentials.password);
        if (!validation.isValid) {
            return of({
                success: false,
                message: `Invalid credential format: ${validation.errors.join(', ')}`
            });
        }
        
        return this.http.post<any>(`${this.baseUrl}/login`, credentials).pipe(
            map(response => this.processLoginResponse(response)),
            catchError(error => this.handleAuthError(error, credentials.username)),
            map(response => {
                if (response.success && response.user && response.token) {
                    this.storeAuthData(response);
                    this.fetchEmployeeStatusAfterLogin(response.user.id);
                    console.log('✅ Login successful');
                }
                return response;
            })
        );
    }

    /**
     * Process backend login response and map to unified format
     */
    private processLoginResponse(response: any): LoginResponse {
        console.log('📊 Backend response:', response);
        
        if (response.token?.tokens && response.data) {
            const userData = response.data;
            const mappedUser: Employee = {
                id: userData._id || userData.id,
                name: userData.employeeName || userData.name || userData.username,
                email: userData.employeeEmail || userData.email || '',
                username: userData.username,
                password: '',
                role: userData.role || 'employee',
                department: userData.department || 'General',
                status: userData.status ?? true,
                joiningDate: userData.joiningDate
            };
            
            // Store attendance status from login response
            const attendanceStatus = userData.attendanceStatus || userData.status;
            if (typeof attendanceStatus === 'boolean') {
                localStorage.setItem('currentAttendanceStatus', attendanceStatus.toString());
                console.log('💾 Stored attendance status from login:', attendanceStatus);
            } else {
                localStorage.setItem('currentAttendanceStatus', 'false');
                console.log('💾 No attendance status in login response, defaulting to false');
            }
            
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

    /**
     * Fetch employee status after login for attendance sync
     */
    private fetchEmployeeStatusAfterLogin(userId: string): void {
        const token = localStorage.getItem('token');
        if (!token) return;

        console.log('🔍 Fetching employee status from /allemp for user:', userId);
        
        this.http.get<any>(`${this.baseUrl}/allemp`, {
            headers: { 'Authorization': `Bearer ${token}` }
        }).subscribe({
            next: (response) => {
                if (response.data && Array.isArray(response.data)) {
                    const currentUser = response.data.find((emp: any) => emp._id === userId);
                    
                    if (currentUser) {
                        localStorage.setItem('currentAttendanceStatus', currentUser.status.toString());
                        localStorage.setItem('currentUserEmployeeData', JSON.stringify(currentUser));
                        
                        console.log('✅ Updated attendance status from /allemp:', {
                            userId: userId,
                            username: currentUser.username,
                            status: currentUser.status,
                            name: currentUser.employeeName
                        });
                    }
                }
            },
            error: (error) => {
                console.error('🚨 Error fetching employee status:', error);
            }
        });
    }

    /**
     * Handle authentication errors with proper error mapping
     */
    private handleAuthError(error: any, username: string): Observable<LoginResponse> {
        console.error('🚨 Auth error:', error);
        
        const errorMessages: Record<number, string> = {
            0: 'Unable to connect to server. Please check your connection.',
            400: 'Invalid request format. Please check your credentials.',
            401: `Invalid username '${username}' or password.`,
            404: 'Login service not found. Please contact administrator.',
            500: 'Server error. Please try again later.'
        };
        
        const message = errorMessages[error.status] || 'Authentication service temporarily unavailable.';
        return of({ success: false, message });
    }

    /**
     * Store authentication data in localStorage
     */
    private storeAuthData(response: LoginResponse): void {
        if (!response.user || !response.token) return;
        
        const role = this.determineUserRole(response.user);
        const authData = {
            token: response.token,
            role: role,
            userId: response.user.id,
            username: response.user.username,
            userEmail: response.user.email || '',
            userName: response.user.name || ''
        };
        
        Object.entries(authData).forEach(([key, value]) => {
            localStorage.setItem(key, value);
        });
        
        console.log('💾 Auth data stored');
    }

    /**
     * Determine user role based on user data
     */
    private determineUserRole(user: Employee): string {
        const role = user.role.toLowerCase();
        return (role.includes('admin') || role.includes('manager') || user.username.toLowerCase() === 'admin') 
               ? 'admin' 
               : 'employee';
    }

    /**
     * Logout user and clear all auth data
     */
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

    /**
     * Clear all authentication data from localStorage
     */
    private clearAuthData(): void {
        const authKeys = [
            'token', 'role', 'userId', 'username', 'userEmail', 'userName', 
            'user', 'refreshToken', 'currentAttendanceStatus', 'currentUserEmployeeData'
        ];
        authKeys.forEach(key => localStorage.removeItem(key));
        console.log('🧹 Auth data cleared');
    }

    // === AUTH STATE GETTERS ===
    
    isLoggedIN(): boolean {
        return !!(localStorage.getItem('token') && localStorage.getItem('role'));
    }

    getUserRole(): string | null {
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

    // === VALIDATION HELPERS ===
    
    getCredentialValidationMessage(username: string, password: string): string {
        return this.validationService.getLoginValidationMessage(username, password);
    }

    validateCredentialsFormat(username: string, password: string): ValidationResult {
        const validation = this.validationService.validateCredentials(username, password);
        return {
            isValid: validation.isValid,
            errors: validation.errors,
            message: validation.isValid 
                    ? 'Credentials format is valid' 
                    : `Please fix: ${validation.errors.join(', ')}`
        };
    }
}