import { Component, inject, ViewEncapsulation } from '@angular/core';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder,FormGroup,Validators } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { PopupService } from '../../core/services/popup.service';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-edit-employee-component',
  imports: [ReactiveFormsModule],
  standalone: true,
  templateUrl: './edit-employee-component.html',
  styleUrl: './edit-employee-component.scss',
  encapsulation: ViewEncapsulation.None
})
export class EditEmployeeComponent {
private readonly baseUrl = environment.apiUrl;
 private injectLocation = inject(Location);
 private injectHttpClient = inject(HttpClient);
 private injectActivatedRoute = inject(ActivatedRoute);
 private injectRouter = inject(Router);
 private toastService = inject(ToastService);
 private popupService = inject(PopupService);
 employeeForm!: FormGroup;
 employeeId: string = '';
 isLoading = false;
 isSubmitting = false;
  // constructor to initialize the  form builder
  constructor(private formBuilder: FormBuilder) {
    this.employeeForm  = this.formBuilder.group({
      employeeName:['', Validators.required],
      employeeEmail:['', [Validators.required, Validators.email,]],
      joiningDate:['',],
      role:['', Validators.required],
      username:['', Validators.required],
      password:['1234', [Validators.required, Validators.minLength(4)]],
      workLocation: ['', Validators.required],
      department: ['', Validators.required],
      designation: ['', Validators.required],
      bankAccount: ['', Validators.required],
      uanNumber: [''],
      esiNumber: [''],
      panNumber: [''],
      resourceType: ['Pay Slip', Validators.required],
      address: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      status: ['', Validators.required]
    });

  }
  
  // ngOnInit to get the employee id from the route and fetch the employee data
  ngOnInit() {
    this.employeeId = this.injectActivatedRoute.snapshot.paramMap.get('id') || '';
    if (this.employeeId) {
      this.isLoading = true;
      this.toastService.info({
        title: 'Loading Employee Data',
        message: 'Please wait while we fetch the employee information...',
        duration: 2000
      });
      
      this.injectHttpClient.get<any>(`${this.baseUrl}/view/${this.employeeId}`).subscribe({
        next: (emp:any) => {
          // Map backend field names to form field names
          const formData = {
            employeeName: emp.employeeName || emp.name,
            employeeEmail: emp.employeeEmail || emp.email,
            joiningDate: emp.joinDate || emp.joiningDate,
            role: emp.role,
            username: emp.username,
            password: emp.password || '1234',
            workLocation: emp.workLocation,
            department: emp.department,
            designation: emp.designation,
            bankAccount: emp.bankAccount,
            uanNumber: emp.uanNumber,
            esiNumber: emp.esiNumber,
            panNumber: emp.panNumber,
            resourceType: emp.resourceType || 'Pay Slip',
            address: emp.address || '',
            phone: emp.phone || '',
            status: emp.status ?? false
          };
          
          this.employeeForm.patchValue(formData);
          this.isLoading = false;
          this.toastService.success({
            title: 'Employee Data Loaded',
            message: `Successfully loaded data for ${emp.employeeName || emp.name || 'employee'}`,
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error fetching employee data:', error);
          this.isLoading = false;
          this.toastService.error({
            title: 'Failed to Load Employee',
            message: 'Unable to fetch employee data. Redirecting to employee list...',
            duration: 4000
          });
          setTimeout(() => {
            this.injectRouter.navigate(['/admin/employees']);
          }, 2000);
        }
      });
    }
  }

  // onSubmit to update the employee data
  onSubmit() {
     if(this.employeeForm.invalid || !this.employeeId) {
       this.toastService.warning({
         title: 'Form Validation Failed',
         message: 'Please correct the highlighted errors before submitting.',
         duration: 4000
       });
       return;
     }
     
     // Show confirmation popup before updating
     this.popupService.confirm({
       title: 'Update Employee',
       message: 'Are you sure you want to update this employee\'s information?',
       confirmText: 'Update',
       cancelText: 'Cancel',
       confirmStyle: 'primary'
     }).then((result) => {
       if (result.action === 'confirm') {
         this.performUpdate();
       }
     }).catch((error) => {
       console.error('Update confirmation error:', error);
       this.toastService.error({
         title: 'System Error',
         message: 'Unable to show confirmation dialog. Please try again.',
         duration: 4000
       });
     });
  }

  private performUpdate(): void {
    this.isSubmitting = true;
    
    this.toastService.info({
      title: 'Updating Employee',
      message: 'Please wait while we update the employee information...',
      duration: 3000
    });
    
    // Map form data to backend expected format
    const formValue = this.employeeForm.value;
    const updateData = {
      name: formValue.employeeName,
      email: formValue.employeeEmail,
      joinDate: formValue.joiningDate,
      role: formValue.role,
      username: formValue.username,
      password: formValue.password,
      workLocation: formValue.workLocation,
      department: formValue.department,
      position: formValue.designation,
      bankAccount: formValue.bankAccount,
      uanNumber: formValue.uanNumber,
      esiNumber: formValue.esiNumber,
      panNumber: formValue.panNumber,
      resourceType: formValue.resourceType,
      address: formValue.address,
      phone: formValue.phone,
      status: formValue.status
    };
    
    this.injectHttpClient.put(`${this.baseUrl}/update/${this.employeeId}`, updateData).subscribe({
      next:()=>{
        this.isSubmitting = false;
        this.toastService.success({
          title: 'Employee Updated Successfully!',
          message: `${this.employeeForm.value.employeeName}'s information has been updated.`,
          duration: 4000,
          actions: [
            {
              label: 'View Details',
              action: () => this.injectRouter.navigate(['/admin/employee-details', this.employeeId]),
              style: 'primary'
            },
            {
              label: 'Employee List',
              action: () => this.injectRouter.navigate(['/admin/employees']),
              style: 'secondary'
            }
          ]
        });
        
        // Navigate to employee details after a short delay
        setTimeout(() => {
          this.injectRouter.navigate(['/admin/employee-details', this.employeeId]);
        }, 2000);
      },
      error: (error) => {
        console.error('Error updating employee data:', error);
        this.isSubmitting = false;
        
        this.toastService.error({
          title: 'Update Failed',
          message: 'Unable to update employee information. Please check your connection and try again.',
          duration: 5000,
          actions: [
            {
              label: 'Retry',
              action: () => this.performUpdate(),
              style: 'primary'
            }
          ]
        });
      }
    });
  }

// back button
  goBack() {
    this.injectLocation.back();
  }
}
