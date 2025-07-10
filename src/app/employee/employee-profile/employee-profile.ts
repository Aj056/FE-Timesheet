import { Component, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SecureAuthService } from '../../core/services/secure-auth.service';

@Component({
  selector: 'app-employee-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './employee-profile.html',
  styleUrls: ['./employee-profile.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EmployeeProfile implements OnInit {
  employee = signal<{ 
    employeeName: string; 
    employeeEmail: string; 
    role: string; 
    username: string; 
    joiningDate: string;
    id?: string;
    name?: string;
    email?: string;
  } | null>(null);

  constructor(
    private router: Router,
    private secureAuth: SecureAuthService
  ) {}

  ngOnInit(): void {
    console.log('Employee Profile component initialized');
    
    // Check if user is authenticated before loading profile
    if (!this.secureAuth.isAuthenticated()) {
      console.warn('User not authenticated, redirecting to login');
      this.router.navigate(['/auth/login']);
      return;
    }
    
    // Ensure user has employee role
    const userRole = this.secureAuth.getUserRole();
    if (userRole !== 'employee') {
      console.warn('User does not have employee role:', userRole);
      this.router.navigate(['/auth/login']);
      return;
    }
    
    this.getProfile();
  }

  getProfile() {
    console.log('🔍 Loading employee profile...');
    
    // Try to get user data from SecureAuthService first
    const currentUser = this.secureAuth.getCurrentUser();
    if (currentUser) {
      console.log('✅ User data from SecureAuthService:', currentUser);
      
      const profileData = {
        employeeName: currentUser.employeeName || currentUser.name || currentUser.username || 'Unknown',
        employeeEmail: currentUser.employeeEmail || currentUser.email || 'N/A',
        role: currentUser.role || 'employee',
        username: currentUser.username || currentUser.employeeName || currentUser.name || 'Unknown',
        joiningDate: currentUser.joiningDate || 'N/A',
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email
      };
      
      this.employee.set(profileData);
      console.log('✅ Employee profile data set:', this.employee());
      return;
    }
    
    // Fallback to localStorage if SecureAuthService doesn't have data
    const user = localStorage.getItem('user');
    console.log('📦 Retrieved user data from localStorage:', user);
    
    if (user) {
      try {
        const parsed = JSON.parse(user);
        console.log('📋 Parsed user data:', parsed);
        
        // Handle different user data formats
        const profileData = {
          employeeName: parsed.employeeName || parsed.name || 'Unknown',
          employeeEmail: parsed.employeeEmail || parsed.email || 'N/A',
          role: parsed.role || 'employee',
          username: parsed.username || parsed.employeeName || parsed.name || 'Unknown',
          joiningDate: parsed.joiningDate || 'N/A',
          id: parsed.id,
          name: parsed.name,
          email: parsed.email
        };
        
        this.employee.set(profileData);
        console.log('✅ Employee profile data set:', this.employee());
      } catch (error) {
        console.error('❌ Error parsing user data:', error);
        this.employee.set(null);
      }
    } else {
      console.warn('⚠️ No user data found in localStorage');
      this.employee.set(null);
    }
  }

  goBack(): void {
    this.router.navigate(['/employee']);
  }
}