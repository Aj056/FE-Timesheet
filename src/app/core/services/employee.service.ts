import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Employee {
  id: string;
  name: string;
  email: string;
  joiningDate?: string;
  role: string;
  username: string;
  password?: string;
  department?: string;
  workLocation?: string;
  designation?: string;
  bankAccount?: string;
  uanNumber?: string;
  esiNumber?: string;
  panNumber?: string;
  resourceType?: string;
  address?: string;
  phone?: string;
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Backend API response interface
export interface BackendEmployee {
  _id: string;
  employeeName: string;
  employeeEmail: string;
  workLocation: string;
  department: string;
  role: string;
  designation: string;
  joinDate: string;
  bankAccount: string;
  uanNumber?: string;
  esiNumber?: string;
  panNumber: string;
  resourceType: string;
  username: string;
  password: string;
  address: string;
  phone: string;
  status: boolean;
  __v?: number;
}

export interface CreateEmployeeRequest {
  name: string; // changed from employeeName
  email: string; // changed from employeeEmail
  workLocation: string;
  department: string;
  role: string;
  position: string; // changed from designation
  joinDate: string; // changed from joiningDate
  bankAccount: string;
  uanNumber?: string;
  esiNumber?: string;
  panNumber: string;
  resourceType: string;
  username: string;
  password: string;
  address: string; // added
  phone: string; // added
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl; // Use environment configuration

  // Get all employees with pagination and search
  getAllEmployees(page = 1, limit = 1000, search = ''): Observable<any> {
    console.log('🔍 Loading employees with params:', { page, limit, search });

    return this.http.get<any>(`${this.baseUrl}/allemp`)
      .pipe(
        map(response => {
          console.log('📊 All employees response:', response);
          
          // Handle new backend response structure: { data: [...] }
          if (response && response.data && Array.isArray(response.data)) {
            return {
              success: true,
              employees: response.data.map((emp: any) => this.mapBackendToFrontend(emp)),
              totalEmployees: response.data.length,
              totalPages: 1,
              currentPage: 1
            };
          } else {
            return {
              success: false,
              employees: [],
              message: 'No employees found'
            };
          }
        }),
        catchError(error => {
          console.error('Failed to fetch employees:', error);
          return of({
            success: false,
            employees: [],
            message: 'Failed to fetch employees'
          });
        })
      );
  }

  // Get employee by ID
  getEmployeeById(id: string): Observable<Employee | null> {
    return this.http.get<any>(`${this.baseUrl}/view/${id}`)
      .pipe(
        map(response => {
          console.log('👤 Employee by ID response:', response);
          
          if (response) {
            return this.mapBackendToFrontend(response);
          }
          return null;
        }),
      catchError(error => {
        console.error('Failed to fetch employee:', error);
        return of(null);
      })
    );
  }

  // Create new employee
  createEmployee(employeeData: CreateEmployeeRequest): Observable<any> {
    const backendData = this.mapFrontendToBackend(employeeData);

    return this.http.post<any>(`${this.baseUrl}/register`, backendData).pipe(
      map(response => {
        console.log('✅ Create employee response:', response);
        
        if (response.success && response.employee) {
          return {
            success: true,
            employee: this.mapBackendToFrontend(response.employee),
            message: response.message || 'Employee created successfully'
          };
        }
        
        return {
          success: false,
          message: response.message || 'Failed to create employee'
        };
      }),
      catchError(error => {
        console.error('Failed to create employee:', error);
        return of({
          success: false,
          message: 'Failed to create employee'
        });
      })
    );
  }

  // Update employee
  updateEmployee(id: string, employeeData: Partial<Employee>): Observable<any> {
    const backendData = this.mapFrontendToBackend(employeeData);
    
    return this.http.put<any>(`${this.baseUrl}/update/${id}`, backendData).pipe(
      map(response => {
        console.log('✅ Update employee response:', response);
        
        if (response && response.success) {
          return {
            success: true,
            employee: response.employee ? this.mapBackendToFrontend(response.employee) : null,
            message: response.message || 'Employee updated successfully'
          };
        }
        
        return {
          success: false,
          message: response?.message || 'Failed to update employee'
        };
      }),
      catchError(error => {
        console.error('Failed to update employee:', error);
        return of({
          success: false,
          message: 'Failed to update employee'
        });
      })
    );
  }

  // Delete employee
  deleteEmployee(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/delete/${id}`).pipe(
      map(response => {
        console.log('✅ Delete employee response:', response);
        return response;
      }),
      catchError(error => {
        console.error('Failed to delete employee:', error);
        return of({
          success: false,
          message: 'Failed to delete employee'
        });
      })
    );
  }

  // Search employees by name or role
  searchEmployees(query: string): Observable<any> {
    return this.getAllEmployees().pipe(
      map(response => {
        if (response.success && response.employees) {
          return {
            success: true,
            employees: response.employees.filter((emp: any) => 
              emp.name.toLowerCase().includes(query.toLowerCase()) ||
              emp.role.toLowerCase().includes(query.toLowerCase()) ||
              emp.email.toLowerCase().includes(query.toLowerCase())
            )
          };
        }
        return { success: false, employees: [] };
      })
    );
  }

  // Validate employee login credentials
  validateLogin(username: string, password: string): Observable<Employee | null> {
    const loginData = { username, password };
    
    return this.http.post<any>(`${this.baseUrl}/login`, loginData).pipe(
      map(response => {
        if (response.message === 'Login Successfully' && response.data) {
          const user = response.data;
          // Map backend user data to frontend format
          return {
            id: user._id || user.id,
            name: user.employeeName,
            email: user.employeeEmail,
            joiningDate: user.joiningDate,
            role: user.role,
            username: user.username,
            password: user.password,
            department: user.department || 'IT',
            address: user.address,
            phone: user.phone,
            status: user.status ?? true,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          };
        }
        return null;
      }),
      catchError(error => {
        console.error('Failed to validate login:', error);
        return of(null);
      })
    );
  }

  // Get ALL employees without pagination
  getAllEmployeesNoPagination(search = ''): Observable<any> {
    console.log('🔍 Loading ALL employees without pagination');
    console.log('🌐 Request URL:', `${this.baseUrl}/allemp`);

    return this.http.get<any>(`${this.baseUrl}/allemp`)
      .pipe(
        map(response => {
          console.log('📊 All employees (no pagination) response:', response);
          
          // Handle new backend response structure: { data: [...] }
          if (response && response.data && Array.isArray(response.data)) {
            let employees = response.data.map((emp: any) => ({
              id: emp._id || emp.id,
              name: emp.employeeName || emp.name,
              employeeName: emp.employeeName || emp.name,
              email: emp.employeeEmail || emp.email,
              employeeEmail: emp.employeeEmail || emp.email,
              joiningDate: emp.joiningDate || emp.joinDate,
              role: emp.role || 'employee',
              username: emp.username,
              department: emp.department || 'General',
              status: emp.status === false ? 'inactive' : 'active', // Default to active if undefined or true
              createdAt: emp.createdAt,
              updatedAt: emp.updatedAt
            }));

            // Apply search filter if provided
            if (search) {
              employees = employees.filter((emp: any) => 
                emp.name.toLowerCase().includes(search.toLowerCase()) ||
                emp.email.toLowerCase().includes(search.toLowerCase()) ||
                emp.role.toLowerCase().includes(search.toLowerCase()) ||
                emp.username.toLowerCase().includes(search.toLowerCase())
              );
            }

            return {
              success: true,
              employees: employees,
              totalEmployees: employees.length,
              currentPage: 1,
              totalPages: 1
            };
          } else {
            console.error('❌ Invalid response format from employee API');
            return {
              success: false,
              employees: [],
              totalEmployees: 0,
              message: response?.message || 'Failed to load employees'
            };
          }
        }),
        catchError(error => {
          console.error('🚨 Error loading all employees:', error);
          return of({
            success: false,
            employees: [],
            totalEmployees: 0,
            message: 'Failed to load employees. Please check authentication.'
          });
        })
      );
  }

  // Generate unique ID for new employees
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Helper function to map backend employee data to frontend Employee interface
  private mapBackendToFrontend(backendEmp: any): Employee {
    return {
      id: backendEmp._id || backendEmp.id,
      name: backendEmp.employeeName || backendEmp.name,
      email: backendEmp.employeeEmail || backendEmp.email,
      joiningDate: backendEmp.joinDate || backendEmp.joiningDate,
      role: backendEmp.role || 'employee',
      username: backendEmp.username,
      password: backendEmp.password, // Include password for editing
      department: backendEmp.department,
      workLocation: backendEmp.workLocation,
      designation: backendEmp.designation,
      bankAccount: backendEmp.bankAccount,
      uanNumber: backendEmp.uanNumber,
      esiNumber: backendEmp.esiNumber,
      panNumber: backendEmp.panNumber,
      resourceType: backendEmp.resourceType,
      address: backendEmp.address,
      phone: backendEmp.phone,
      status: backendEmp.status === true, // Ensure boolean
      createdAt: backendEmp.createdAt,
      updatedAt: backendEmp.updatedAt
    };
  }

  // Helper function to map frontend Employee to backend format
  private mapFrontendToBackend(frontendEmp: any): any {
    return {
      employeeName: frontendEmp.name || frontendEmp.employeeName,
      employeeEmail: frontendEmp.email || frontendEmp.employeeEmail,
      workLocation: frontendEmp.workLocation,
      department: frontendEmp.department,
      role: frontendEmp.role,
      designation: frontendEmp.designation || frontendEmp.position,
      joinDate: frontendEmp.joiningDate || frontendEmp.joinDate,
      bankAccount: frontendEmp.bankAccount,
      uanNumber: frontendEmp.uanNumber || 'NA',
      esiNumber: frontendEmp.esiNumber || 'N/A',
      panNumber: frontendEmp.panNumber,
      resourceType: frontendEmp.resourceType,
      username: frontendEmp.username,
      password: frontendEmp.password,
      address: frontendEmp.address,
      phone: frontendEmp.phone,
      status: frontendEmp.status
    };
  }
}
