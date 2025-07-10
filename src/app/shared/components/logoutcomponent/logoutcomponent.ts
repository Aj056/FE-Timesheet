import { Component } from '@angular/core';
import { Authservice } from '../../../core/services/auth.service';
import { SecureAuthService } from '../../../core/services/secure-auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-logoutcomponent',
  standalone: true,
  imports: [],
  templateUrl: './logoutcomponent.html',
  styleUrl: './logoutcomponent.scss'
})
export class Logoutcomponent {
  constructor(
    private auth: Authservice, // Keep for backward compatibility
    private secureAuth: SecureAuthService,
    private router: Router
  ) {}

  logout() {
    console.log('🚪 Logout initiated from shared component');
    
    try {
      // Clear all authentication data immediately
      this.clearAllAuthData();
      
      console.log('✅ Logout completed successfully');
      
      // Force redirect to login page
      window.location.href = '/auth/login';
      
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
