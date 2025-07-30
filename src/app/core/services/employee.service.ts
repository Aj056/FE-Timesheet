import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Employee, CreateEmployeeRequest, ApiResponse } from '../interfaces/common.interfaces';

// Backend API response interface (for mapping)
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

/**
 * Streamlined Employee Service
 * Handles employee CRUD operations with simplified logic
 */
@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Get all employees with optional pagination and search
   */
  getAllEmployees(page = 1, limit = 1000, search = ''): Observable<ApiResponse<Employee[]>> {
    console.log('🔍 Loading employees with params:', { page, limit, search });
    console.log('🌐 Calling API endpoint:', `${this.baseUrl}/allemp`);

    return this.http.get<any>(`${this.baseUrl}/allemp`).pipe(
      map(response => {
        console.log('📊 Raw API response:', response);
        console.log('📊 Response type:', typeof response);
        console.log('📊 Response keys:', Object.keys(response || {}));
        
        if (response?.data && Array.isArray(response.data)) {
          const mappedEmployees = response.data.map((emp: any) => this.mapBackendToFrontend(emp)).filter((emp:any) => emp.role !== 'admin');
          console.log('✅ Mapped employees:', mappedEmployees);
          return {
            success: true,
            data: mappedEmployees,
            message: `Found ${mappedEmployees.length} employees`
          };
        } else if (response && Array.isArray(response)) {
          // Handle case where API returns array directly without wrapper
          console.log('📦 Direct array response detected');
          const mappedEmployees = response.map((emp: any) => this.mapBackendToFrontend(emp)).filter((emp)=> emp.role !== 'admin');
          console.log('✅ Mapped employees from direct array:', mappedEmployees);
          return {
            success: true,
            data: mappedEmployees,
            message: `Found ${response.length} employees`
          };
        } else {
          console.log('❌ Unexpected response structure:', response);
          return {
            success: false,
            data: [],
            message: 'No employees found or unexpected response format'
          };
        }
      }),
      catchError(error => {
        console.error('❌ Failed to fetch employees:', error);
        console.error('❌ Error status:', error.status);
        console.error('❌ Error message:', error.message);
        console.error('❌ Full error object:', error);
        
        return of({
          success: false,
          data: [],
          message: `Failed to fetch employees: ${error.message || 'Unknown error'}`
        });
      })
    );  
  }

  /**
   * Get employee by ID
   */
  getEmployeeById(id: string): Observable<Employee | null> {
    return this.http.get<any>(`${this.baseUrl}/view/${id}`).pipe(
      map(response => {
        console.log('👤 Employee by ID response:', response);
        return response ? this.mapBackendToFrontend(response) : null;
      }),
      catchError(error => {
        console.error('Failed to fetch employee:', error);
        return of(null);
      })
    );
  }

  /**
   * Create new employee
   */
  createEmployee(employeeData: CreateEmployeeRequest): Observable<ApiResponse<Employee>> {
    const backendData = this.mapFrontendToBackend(employeeData);

    return this.http.post<any>(`${this.baseUrl}/register`, backendData).pipe(
      map(response => {
        console.log('✅ Create employee response:', response);
        
        if (response.success && response.employee) {
          return {
            success: true,
            data: this.mapBackendToFrontend(response.employee),
            message: response.message || 'Employee created successfully'
          };
        }
        
        return {
          success: false,
          data: undefined,
          message: response.message || 'Failed to create employee'
        };
      }),
      catchError(error => {
        console.error('Failed to create employee:', error);
        return of({
          success: false,
          data: undefined,
          message: 'Failed to create employee'
        });
      })
    );
  }

  /**
   * Update employee
   */
  updateEmployee(id: string, employeeData: Partial<Employee>): Observable<ApiResponse<Employee>> {
    const backendData = this.mapFrontendToBackend(employeeData);
    
    return this.http.put<any>(`${this.baseUrl}/update/${id}`, backendData).pipe(
      map(response => {
        console.log('✅ Update employee response:', response);
        
        if (response?.success) {
          return {
            success: true,
            data: response.employee ? this.mapBackendToFrontend(response.employee) : undefined,
            message: response.message || 'Employee updated successfully'
          };
        }
        
        return {
          success: false,
          data: undefined,
          message: response?.message || 'Failed to update employee'
        };
      }),
      catchError(error => {
        console.error('Failed to update employee:', error);
        return of({
          success: false,
          data: undefined,
          message: 'Failed to update employee'
        });
      })
    );
  }

  /**
   * Delete employee
   */
  deleteEmployee(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<any>(`${this.baseUrl}/delete/${id}`).pipe(
      map(response => {
        console.log('🗑️ Delete employee response:', response);
        
        return {
          success: response?.success || false,
          data: response?.success || false,
          message: response?.message || (response?.success ? 'Employee deleted successfully' : 'Failed to delete employee')
        };
      }),
      catchError(error => {
        console.error('Failed to delete employee:', error);
        return of({
          success: false,
          data: false,
          message: 'Failed to delete employee'
        });
      })
    );
  }

  /**
   * Validate employee login credentials
   */
  validateLogin(username: string, password: string): Observable<Employee | null> {
    const loginData = { username, password };
    
    return this.http.post<any>(`${this.baseUrl}/login`, loginData).pipe(
      map(response => {
        if (response.message === 'Login Successfully' && response.data) {
          return this.mapBackendToFrontend(response.data);
        }
        return null;
      }),
      catchError(error => {
        console.error('Failed to validate login:', error);
        return of(null);
      })
    );
  }

  // === PRIVATE MAPPING METHODS ===

  /**
   * Map backend employee data to frontend format
   */
  private mapBackendToFrontend(backendEmp: any): Employee {
    return {
      _id: backendEmp._id || backendEmp.id,
      employeeName: backendEmp.employeeName || backendEmp.name,
      employeeEmail: backendEmp.employeeEmail || backendEmp.email,
      username: backendEmp.username,
      password: backendEmp.password,
      role: backendEmp.role,
      department: backendEmp.department,
      joiningDate: backendEmp.joinDate || backendEmp.joiningDate,
      workLocation: backendEmp.workLocation,
      designation: backendEmp.designation,
      bankAccount: backendEmp.bankAccount,
      uanNumber: backendEmp.uanNumber,
      esiNumber: backendEmp.esiNumber,
      panNumber: backendEmp.panNumber,
      resourceType: backendEmp.resourceType,
      address: backendEmp.address,
      phone: backendEmp.phone,
      status: backendEmp.status ?? false,
      createdAt: backendEmp.createdAt,
      updatedAt: backendEmp.updatedAt
    };
  }

  /**
   * Map frontend employee data to backend format
   */
  private mapFrontendToBackend(frontendEmp: any): any {
    return {
      employeeName: frontendEmp.name || frontendEmp.employeeName,
      employeeEmail: frontendEmp.email || frontendEmp.employeeEmail,
      username: frontendEmp.username,
      password: frontendEmp.password,
      role: frontendEmp.role,
      department: frontendEmp.department,
      joinDate: frontendEmp.joinDate || frontendEmp.joiningDate,
      workLocation: frontendEmp.workLocation,
      designation: frontendEmp.designation || frontendEmp.position,
      bankAccount: frontendEmp.bankAccount,
      uanNumber: frontendEmp.uanNumber,
      esiNumber: frontendEmp.esiNumber,
      panNumber: frontendEmp.panNumber,
      resourceType: frontendEmp.resourceType,
      address: frontendEmp.address,
      phone: frontendEmp.phone,
      status: frontendEmp.status ?? false
    };
  }
}
