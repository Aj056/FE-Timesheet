import { Component, signal, computed, ViewEncapsulation } from '@angular/core';
import {Router} from '@angular/router'
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeService, Employee } from '../../core/services/employee.service';
import { ToastService } from '../../core/services/toast.service';
import { PopupService } from '../../core/services/popup.service';

@Component({
  selector: 'app-employees-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './employees-list.html',
  styleUrl: './employees-list.scss',
  encapsulation: ViewEncapsulation.None
})
export class EmployeesList {
  constructor(
    private router: Router, 
    private employeeService: EmployeeService,
    private toastService: ToastService,
    private popupService: PopupService
  ) {}
  
  employees = signal<Employee[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  searchTerm = signal<string>('');
  
  // Computed signal for filtered employees based on search term
  filteredEmployees = computed(() => {
    const employees = this.employees();
    const searchTerm = this.searchTerm().toLowerCase().trim();
    
    // Return empty array if employees is null/undefined
    if (!Array.isArray(employees)) {
      return [];
    }
    
    if (!searchTerm) {
      return employees;
    }
    
    return employees.filter(employee => {
      const name = (employee.name || employee.username || '').toLowerCase();
      const email = (employee.email || '').toLowerCase();
      const department = (employee.department || '').toLowerCase();
      const designation = (employee.designation || '').toLowerCase();
      const phone = (employee.phone || '').toLowerCase();
      
      return name.includes(searchTerm) || 
             email.includes(searchTerm) || 
             department.includes(searchTerm) ||
             designation.includes(searchTerm) ||
             phone.includes(searchTerm);
    });
  });
  
  ngOnInit() {
    this.getEmployees();
  }
  
  // fetch employees from the backend
  getEmployees() {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.toastService.info({
      title: 'Loading Employees',
      message: 'Fetching employee data from the server...',
      duration: 2000
    });
    
    this.employeeService.getAllEmployees()
      .subscribe({
        next: (response: any) => {
          console.log('📊 Employee service response:', response);
          
          if (response && response.success && Array.isArray(response.employees)) {
            this.employees.set(response.employees);
            this.isLoading.set(false);
            console.log('Employees fetched successfully!', response.employees);
            
            this.toastService.success({
              title: 'Employees Loaded Successfully',
              message: `Found ${response.employees.length} employee${response.employees.length !== 1 ? 's' : ''} in the system.`,
              duration: 3000
            });
          } else {
            // Handle case where API returns success: false
            this.employees.set([]);
            this.isLoading.set(false);
            this.error.set(response?.message || 'Failed to load employees');
            
            this.toastService.warning({
              title: 'No Employees Found',
              message: response?.message || 'No employee data available. Please check with administration.',
              duration: 4000
            });
          }
        },
        error: (error) => {
          console.error('There was an error fetching the employees!', error);
          this.error.set('Failed to load employees');
          this.isLoading.set(false);
          
          this.toastService.error({
            title: 'Failed to Load Employees',
            message: 'Unable to fetch employee data. Please check your connection and try again.',
            duration: 5000,
            actions: [
              {
                label: 'Retry',
                action: () => this.getEmployees(),
                style: 'primary'
              }
            ]
          });
        }
      });
  }

  // view employee details
  viewDetails(employeeId: string) {
    this.toastService.info({
      title: 'Loading Employee Details',
      message: 'Navigating to employee details page...',
      duration: 2000
    });
    this.router.navigate(['/admin/employee-details', employeeId]);
  }

  // refresh employee list
  refreshList() {
    this.toastService.info({
      title: 'Refreshing Data',
      message: 'Updating employee list...',
      duration: 2000
    });
    this.getEmployees();
  }

  // refresh data (alias for refreshList)
  refreshData() {
    this.refreshList();
  }

  // Delete employee with confirmation
  deleteEmployee(employee: Employee) {
    this.popupService.confirm({
      title: 'Delete Employee',
      message: `Are you sure you want to delete ${employee.name || 'this employee'}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmStyle: 'danger'
    }).then((result) => {
      if (result.action === 'confirm') {
        this.performDelete(employee);
      }
    }).catch((error) => {
      console.error('Delete confirmation error:', error);
      this.toastService.error({
        title: 'System Error',
        message: 'Unable to show delete confirmation. Please try again.',
        duration: 4000
      });
    });
  }

  private performDelete(employee: Employee): void {
    this.toastService.info({
      title: 'Deleting Employee',
      message: `Removing ${employee.name} from the system...`,
      duration: 3000
    });

    this.employeeService.deleteEmployee(employee.id || '').subscribe({
      next: () => {
        // Remove from local array
        const currentEmployees = this.employees();
        if (Array.isArray(currentEmployees)) {
          const updatedEmployees = currentEmployees.filter(emp => emp.id !== employee.id);
          this.employees.set(updatedEmployees);
        }
        
        this.toastService.success({
          title: 'Employee Deleted Successfully',
          message: `${employee.name} has been removed from the system.`,
          duration: 4000
        });
      },
      error: (error) => {
        console.error('Error deleting employee:', error);
        this.toastService.error({
          title: 'Delete Failed',
          message: 'Unable to delete employee. Please try again.',
          duration: 5000,
          actions: [
            {
              label: 'Retry',
              action: () => this.performDelete(employee),
              style: 'primary'
            }
          ]
        });
      }
    });
  }

  // get total employees count
  totalEmployeesCount() {
    const employees = this.employees();
    return Array.isArray(employees) ? employees.length : 0;
  }

  // get active employees count
  activeEmployeesCount() {
    const employees = this.employees();
    return Array.isArray(employees) ? employees.filter(emp => emp.status === true).length : 0;
  }

  // get inactive employees count
  inactiveEmployeesCount() {
    const employees = this.employees();
    return Array.isArray(employees) ? employees.filter(emp => emp.status === false).length : 0;
  }

  // track function for ngFor
  trackEmployee(index: number, employee: Employee): string {
    return employee.id || index.toString();
  }

  // get role class for styling
  getRoleClass(role: string): string {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'role-admin';
      case 'manager':
        return 'role-manager';
      case 'employee':
        return 'role-employee';
      default:
        return 'role-default';
    }
  }

  // get status class for styling
  getStatusClass(status: boolean): string {
    return status === true ? 'status-active' : 'status-inactive';
  }

  // get status text for display
  getStatusText(status: boolean): string {
    return status === true ? 'Active' : 'Inactive';
  }

  // get short address for table display
  getShortAddress(address: string): string {
    if (!address) return '';
    const maxLength = 30;
    return address.length > maxLength ? address.substring(0, maxLength) + '...' : address;
  }

  // edit employee
  editEmployee(employeeId: string) {
    this.router.navigate(['/admin/edit-employee', employeeId]);
  }

  // search functionality
  onSearchChange(searchTerm: string) {
    this.searchTerm.set(searchTerm);
  }

  // clear search
  clearSearch() {
    this.searchTerm.set('');
  }

  // get search results count
  getSearchResultsCount(): number {
    return this.filteredEmployees().length;
  }

  // check if search is active
  isSearchActive(): boolean {
    return this.searchTerm().trim().length > 0;
  }
}
