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
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEmployeeRequest {
  employeeName: string;
  employeeEmail: string;
  workLocation: string;
  department: string;
  role: string;
  designation: string;
  joiningDate: string;
  bankAccount: string;
  uanNumber?: string;
  esiNumber?: string;
  panNumber: string;
  resourceType: string;
  username: string;
  password: string;
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
              employees: response.data.map((emp: any) => ({
                id: emp._id || emp.id,
                name: emp.employeeName || emp.name,
                email: emp.employeeEmail || emp.email,
                joiningDate: emp.joiningDate || emp.joinDate,
                role: emp.role || 'employee',
                username: emp.username,
                department: emp.department || 'General',
                position: emp.position || 'Employee',
                status: emp.status === false ? 'inactive' : 'active', // Default to active if undefined or true
                createdAt: emp.createdAt,
                updatedAt: emp.updatedAt
              })),
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
            const emp = response;
            return {
              id: emp._id || emp.id,
              name: emp.name,
              email: emp.email,
              joiningDate: emp.joinDate,
              role: emp.role || 'employee',
              username: emp.username || emp.employeeId,
              department: emp.department,
              position: emp.position,
              status: emp.status || 'active',
              createdAt: emp.createdAt,
              updatedAt: emp.updatedAt
            };
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
    const newEmployeeData = {
      name: employeeData.employeeName,
      email: employeeData.employeeEmail,
      workLocation: employeeData.workLocation,
      department: employeeData.department,
      role: employeeData.role,
      designation: employeeData.designation,
      joinDate: employeeData.joiningDate,
      bankAccount: employeeData.bankAccount,
      uanNumber: employeeData.uanNumber || 'NA',
      esiNumber: employeeData.esiNumber || 'N/A',
      panNumber: employeeData.panNumber,
      resourceType: employeeData.resourceType,
      position: employeeData.designation,
      phone: '',
      address: '',
      username: employeeData.username,
      password: employeeData.password
    };

    return this.http.post<any>(`${this.baseUrl}/register`, newEmployeeData).pipe(
      map(response => {
        console.log('✅ Create employee response:', response);
        
        if (response.success && response.employee) {
          return {
            success: true,
            employee: {
              id: response.employee._id || response.employee.id,
              name: response.employee.name,
              email: response.employee.email,
              joiningDate: response.employee.joinDate,
              role: response.employee.role || 'employee',
              username: response.employee.username,
              department: response.employee.department,
              workLocation: response.employee.workLocation,
              designation: response.employee.designation,
              bankAccount: response.employee.bankAccount,
              uanNumber: response.employee.uanNumber,
              esiNumber: response.employee.esiNumber,
              panNumber: response.employee.panNumber,
              resourceType: response.employee.resourceType,
              status: response.employee.status || 'active'
            }
          };
        } else {
          return {
            success: false,
            message: response.message || 'Failed to create employee'
          };
        }
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
    return this.http.put<any>(`${this.baseUrl}/update/${id}`, employeeData).pipe(
      map(response => {
        console.log('✅ Update employee response:', response);
        return response;
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
            status: 'active' as const,
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
}
