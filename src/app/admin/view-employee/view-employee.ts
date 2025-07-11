import { Component ,inject,OnInit, signal, ViewEncapsulation} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { EmployeeService, Employee } from '../../core/services/employee.service';
@Component({
  selector: 'app-view-employee',
  imports: [CommonModule,RouterModule],
  standalone: true,
  templateUrl: './view-employee.html',
  styleUrl: './view-employee.scss',
  encapsulation: ViewEncapsulation.None
})
export class ViewEmployee implements OnInit {
 private route = inject(ActivatedRoute)
 private employeeService = inject(EmployeeService);
 private router = inject(Router);
 
 employee = signal<Employee | null>(null);
 isLoading = signal(false);
 error = signal<string | null>(null);
 showPassword = signal(false);
 
 ngOnInit():void{
   const id = this.route.snapshot.paramMap.get('id');
   console.log('Employee ID from route:', id);
   if(id){
    this.loadEmployee(id);
  }
   else{
     console.error('No employee ID provided in the route parameters.');
     this.error.set('No employee ID provided');
   }
}

private loadEmployee(id: string): void {
  this.isLoading.set(true);
  this.error.set(null);
  
  this.employeeService.getEmployeeById(id).subscribe({
    next: (employee: Employee | null) => {
      this.employee.set(employee);
      this.isLoading.set(false);
      if (!employee) {
        this.error.set('Employee not found');
      }
      console.log('Employee details fetched successfully!', employee);
    },
    error: (error) => {       
      console.error('There was an error fetching the employee details!', error);
      this.error.set('Failed to load employee details');
      this.isLoading.set(false);
    } 
  });
}

// edit navigate
 editNavigate(employeeId:any) {
  console.log('Navigating to edit employee with ID:', employeeId);
   this.router.navigate(['/admin/edit-employee/', employeeId]);
}

// generate payslip navigate
generatePayslip(employeeId: any) {
  console.log('Navigating to generate payslip for employee ID:', employeeId);
  this.router.navigate(['/admin/generate-payslip/', employeeId]);
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
getStatusClass(status: boolean | string): string {
  if (typeof status === 'boolean') {
    return status ? 'status-active' : 'status-inactive';
  }
  
  switch (status?.toLowerCase()) {
    case 'active':
    case 'true':
      return 'status-active';
    case 'inactive':
    case 'false':
      return 'status-inactive';
    case 'pending':
      return 'status-pending';
    default:
      return 'status-active';
  }
}

// refresh employee data
refreshEmployee(): void {
  const id = this.route.snapshot.paramMap.get('id');
  if (id) {
    this.loadEmployee(id);
  }
}

// toggle password visibility
togglePasswordVisibility(): void {
  this.showPassword.set(!this.showPassword());
}

// delete employee
deleteEmployee(employeeId: any): void {
  if (!employeeId) {
    console.error('No employee ID provided for deletion');
    return;
  }

  // Confirm deletion
  if (confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
    this.isLoading.set(true);
    this.error.set(null);

    this.employeeService.deleteEmployee(employeeId).subscribe({
      next: () => {
        console.log('Employee deleted successfully');
        this.isLoading.set(false);
        // Navigate back to employees list after successful deletion
        this.router.navigate(['/admin/employees-list']);
      },
      error: (error) => {
        console.error('Error deleting employee:', error);
        this.error.set('Failed to delete employee');
        this.isLoading.set(false);
      }
    });
  }
}
}
