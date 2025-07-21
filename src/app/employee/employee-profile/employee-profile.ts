import { Component, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Employee } from '../../core/interfaces/common.interfaces';

@Component({
  selector: 'app-employee-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './employee-profile.html',
  styleUrls: ['./employee-profile.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EmployeeProfile implements OnInit {
  employee = signal<Employee | null>(null);

  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    console.log('Employee Profile component initialized');
    
    // Check if user is authenticated before loading profile
    if (!this.auth.isLoggedIN()) {
      console.warn('User not authenticated, redirecting to login');
      this.router.navigate(['/auth/login']);
      return;
    }
    
    // Ensure user has employee role
    const userRole = this.auth.getUserRole();
    if (userRole !== 'employee') {
      console.warn('User does not have employee role:', userRole);
      this.router.navigate(['/auth/login']);
      return;
    }
    
    this.getProfile();
  }

  getProfile() {
    console.log('🔍 Loading employee profile...');
    
    // Get user data from AuthService
    const userId = this.auth.getCurrentUserId();
    const userName = this.auth.getCurrentUserName();
    const userEmail = this.auth.getCurrentUserEmail();
    const username = this.auth.getCurrentUsername();
    const role = this.auth.getUserRole();
    
    // Try to get comprehensive employee data from localStorage
    let employeeData = null;
    try {
      const storedEmployeeData = localStorage.getItem('currentUserEmployeeData');
      if (storedEmployeeData) {
        employeeData = JSON.parse(storedEmployeeData);
      }
    } catch (e) {
      console.warn('Could not parse employee data from localStorage');
    }
    
    // Get additional profile data from individual localStorage items
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
    
    if (userId && userName) {
      console.log('✅ User data from AuthService:', {
        userId, userName, userEmail, username, role
      });
      
      const profileData: Employee = {
        id: userId,
        name: userName,
        email: userEmail || employeeData?.employeeEmail || '',
        username: username || userName || employeeData?.username,
        role: role || employeeData?.role || 'employee',
        status: true,
        // Additional fields from your data structure
        designation: designation || employeeData?.designation,
        department: department || employeeData?.department,
        workLocation: workLocation || employeeData?.workLocation,
        phone: phone || employeeData?.phone,
        address: address || employeeData?.address,
        joinDate: joinDate || employeeData?.joinDate,
        panNumber: panNumber || employeeData?.panNumber,
        esiNumber: esiNumber || employeeData?.esiNumber,
        uanNumber: uanNumber || employeeData?.uanNumber,
        bankAccount: bankAccount || employeeData?.bankAccount
      };
      
      this.employee.set(profileData);
      console.log('✅ Employee profile data set:', this.employee());
      return;
    }
    
    // Fallback to localStorage with correct key structure
    const fallbackUserId = localStorage.getItem('userId');
    const fallbackUserName = localStorage.getItem('userName');
    const fallbackUserEmail = localStorage.getItem('userEmail');
    const fallbackRole = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    
    console.log('📁 Retrieved user data from localStorage keys:', {
      userId: !!fallbackUserId,
      userName: !!fallbackUserName,
      userEmail: !!fallbackUserEmail,
      role: !!fallbackRole,
      token: !!token
    });
    
    if (fallbackUserId && fallbackUserName && token) {
      const profileData: Employee = {
        id: fallbackUserId,
        name: fallbackUserName,
        email: fallbackUserEmail || '',
        username: fallbackUserEmail || fallbackUserName,
        role: fallbackRole || 'employee',
        status: true
      };
      
      this.employee.set(profileData);
      console.log('✅ Employee profile data set from localStorage keys:', this.employee());
      return;
    }
    
    // No user data found
    console.warn('⚠️ No user data found in localStorage');
    this.employee.set(null);
  }

  logout(): void {
    try {
      console.log('Employee logging out...');
      
      // Use the AuthService logout method
      this.auth.logout();
      
      // Navigate to login page
      this.router.navigate(['/auth/login']);
      
      console.log('Employee logout completed successfully');
    } catch (error) {
      console.error('Error during employee logout:', error);
      // Still navigate to login even if there's an error
      this.router.navigate(['/auth/login']);
    }
  }

  goBack(): void {
    this.router.navigate(['/employee']);
  }

  // Get user initials (first two characters of the name)
  getUserInitials(): string {
    const emp = this.employee();
    if (!emp?.name) return 'US'; // Default initials
    
    const names = emp.name.trim().split(' ');
    if (names.length === 1) {
      // Single name - take first two characters
      return names[0].substring(0, 2).toUpperCase();
    } else {
      // Multiple names - take first character of first two words
      return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
    }
  }
}