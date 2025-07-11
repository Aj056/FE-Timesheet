import { Component, OnInit, Optional, ViewEncapsulation } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EmployeeService, CreateEmployeeRequest } from '../../core/services/employee.service';
import { ValidationService } from '../../core/services/validation.service';
import { PasswordSecurityService } from '../../core/services/password-security.service';
import { ToastService } from '../../core/services/toast.service';
import { PopupService } from '../../core/services/popup.service';

@Component({
  selector: 'app-create-employee',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule, CommonModule],
  templateUrl: './create-employee.html',
  styleUrl: './create-employee.scss',
  encapsulation: ViewEncapsulation.None
})
export class CreateEmployee implements OnInit {
  employeeForm: FormGroup = new FormGroup({});
  isSubmitting = false;
  validationErrors: string[] = [];
  passwordStrength = 0;
  generatedPassword = '';
  showPassword = true; // Password visible by default for admin convenience

  constructor(
    private formBuilder: FormBuilder,
    private employeeService: EmployeeService,
    private validationService: ValidationService,
    private passwordSecurity: PasswordSecurityService,
    private toastService: ToastService,
    private popupService: PopupService
  ) {}
  
  ngOnInit() {
    this.employeeForm = this.formBuilder.group({
      employeeName: ['', [Validators.required, Validators.minLength(2)]],
      employeeEmail: ['', [Validators.required, Validators.email]],
      workLocation: ['Bangalore', [Validators.required]],
      department: ['Software Development', [Validators.required]],
      role: ['', Validators.required],
      designation: ['', [Validators.required]],
      joiningDate: ['', Validators.required],
      bankAccount: ['', [Validators.required, Validators.pattern(/^\d{8,20}$/)]],
      uanNumber: ['NA'],
      esiNumber: ['N/A'],
      panNumber: ['', [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
      resourceType: ['', Validators.required],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      address: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
    });

    // Generate a secure default password
    this.generateSecurePassword();
    
    // Set up live validation
    this.setupLiveValidation();
  }

  // Set up live validation for better UX
  private setupLiveValidation(): void {
    // Mark fields as touched when they lose focus
    Object.keys(this.employeeForm.controls).forEach(key => {
      const control = this.employeeForm.get(key);
      if (control) {
        // Mark as touched on blur for immediate validation feedback
        control.valueChanges.subscribe(() => {
          if (control.dirty) {
            control.markAsTouched();
          }
        });
      }
    });
  }

  generateSecurePassword(): void {
    this.generatedPassword = this.passwordSecurity.generateSecurePassword();
    this.employeeForm.patchValue({
      password: this.generatedPassword
    });
    this.checkPasswordStrength();
    
    // Show toast notification about password generation
    this.toastService.info({
      title: 'Secure Password Generated',
      message: 'A secure password has been automatically generated for the employee.',
      duration: 3000
    });
  }

  onPasswordChange(): void {
    this.checkPasswordStrength();
  }

  private checkPasswordStrength(): void {
    const password = this.employeeForm.get('password')?.value || '';
    this.passwordStrength = this.passwordSecurity.validatePassword(password).strength;
  }

  // Toggle password visibility
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
    this.toastService.info({
      title: 'Password Visibility',
      message: this.showPassword ? 'Password is now visible' : 'Password is now hidden',
      duration: 2000
    });
  }

  // Copy password to clipboard
  copyPasswordToClipboard(): void {
    const password = this.employeeForm.get('password')?.value || '';
    if (password) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(password).then(() => {
          this.toastService.success({
            title: 'Password Copied!',
            message: 'Employee password has been copied to clipboard.',
            duration: 3000
          });
        }).catch(() => {
          this.fallbackCopyPassword(password);
        });
      } else {
        this.fallbackCopyPassword(password);
      }
    } else {
      this.toastService.warning({
        title: 'No Password',
        message: 'Please generate a password first.',
        duration: 3000
      });
    }
  }

  private fallbackCopyPassword(password: string): void {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = password;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      this.toastService.success({
        title: 'Password Copied!',
        message: 'Employee password has been copied to clipboard.',
        duration: 3000
      });
    } catch (err) {
      this.toastService.error({
        title: 'Copy Failed',
        message: 'Unable to copy password. Please copy manually.',
        duration: 4000
      });
    } finally {
      document.body.removeChild(textArea);
    }
  }

  // post our form data to the server
  onSubmit() {
    // Clear previous errors
    this.validationErrors = [];

    // Mark all fields as touched to show validation errors
    Object.keys(this.employeeForm.controls).forEach(key => {
      this.employeeForm.get(key)?.markAsTouched();
    });

    if (!this.validateForm()) {
      // Scroll to the first error field
      this.scrollToFirstError();
      return;
    }

    if (this.employeeForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      console.log('Form Submitted!', this.employeeForm.value);

      // Show loading toast
      this.toastService.info({
        title: 'Creating Employee',
        message: 'Please wait while we create the employee account...',
        duration: 3000
      });

      // Sanitize form data
      const sanitizedData = this.sanitizeFormData();
      const employeeData: CreateEmployeeRequest = sanitizedData;

      // Debug: Log the payload being sent
      console.log('Employee Data Payload:', employeeData);
      console.log('All Form Fields:', Object.keys(this.employeeForm.value));
      console.log('Payload Fields:', Object.keys(employeeData));

      this.employeeService.createEmployee(employeeData)
        .subscribe({
          next: (response) => {
            console.log('Employee created successfully:', response);
            this.employeeForm.reset();
            this.isSubmitting = false;
            this.validationErrors = [];
            
            // Generate new secure password for next employee
            this.generateSecurePassword();
            
            // Show success toast with employee details
            this.toastService.success({
              title: 'Employee Created Successfully!',
              message: `${this.employeeForm.get('employeeName')?.value} has been added to the system with secure credentials.`,
              duration: 5000,
              actions: [
                {
                  label: 'View Employee List',
                  action: () => window.location.href = '/admin/employees',
                  style: 'primary'
                }
              ]
            });
          },
          error: (error) => {
            console.error('Error creating employee:', error);
            this.isSubmitting = false;
            
            if (error.status === 409) {
              this.validationErrors.push('Username or email already exists');
              this.toastService.warning({
                title: 'Duplicate Employee',
                message: 'An employee with this username or email already exists.',
                duration: 4000
              });
            } else if (error.status === 400) {
              this.validationErrors.push('Invalid employee data provided');
              this.toastService.error({
                title: 'Invalid Data',
                message: 'Please check the employee information and try again.',
                duration: 4000
              });
            } else {
              this.validationErrors.push('Error creating employee. Please try again.');
              this.toastService.error({
                title: 'Creation Failed',
                message: 'Unable to create employee. Please check your connection and try again.',
                duration: 5000,
                actions: [
                  {
                    label: 'Retry',
                    action: () => this.onSubmit(),
                    style: 'primary'
                  }
                ]
              });
            }
          }
        });
    } else {
      console.log('Form is invalid');
      this.validationErrors.push('Please correct the form errors before submitting');
      
      // Show validation error toast
      this.toastService.warning({
        title: 'Form Validation Failed',
        message: 'Please correct the highlighted errors before submitting.',
        duration: 4000
      });
      
      // Mark all fields as touched to show validation errors
      Object.keys(this.employeeForm.controls).forEach(key => {
        this.employeeForm.get(key)?.markAsTouched();
      });
    }
  }

private validateForm(): boolean {
    const formValue = this.employeeForm.value;
    let isValid = true;

    // Validate employee name
    if (!formValue.employeeName || formValue.employeeName.trim().length < 2) {
      this.validationErrors.push('Employee name must be at least 2 characters long');
      isValid = false;
    }

    // Validate email
    if (!this.validationService.validateEmail(formValue.employeeEmail)) {
      this.validationErrors.push('Please enter a valid email address');
      isValid = false;
    }

    // Validate required fields
    if (!formValue.role || formValue.role.trim().length === 0) {
      this.validationErrors.push('Role is required');
      isValid = false;
    }

    if (!formValue.designation || formValue.designation.trim().length === 0) {
      this.validationErrors.push('Designation is required');
      isValid = false;
    }

    if (!formValue.joiningDate) {
      this.validationErrors.push('Joining date is required');
      isValid = false;
    }

    if (!formValue.resourceType || formValue.resourceType.trim().length === 0) {
      this.validationErrors.push('Resource type is required');
      isValid = false;
    }

    // Validate address
    if (!formValue.address || formValue.address.trim().length === 0) {
      this.validationErrors.push('Address is required');
      isValid = false;
    }

    // Validate phone number format
    if (!formValue.phone || !formValue.phone.match(/^[0-9]{10}$/)) {
      this.validationErrors.push('Phone number must be 10 digits');
      isValid = false;
    }

    // Validate PAN number format
    if (formValue.panNumber && !formValue.panNumber.match(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)) {
      this.validationErrors.push('PAN number must be in format: ABCDE1234F');
      isValid = false;
    }

    // Validate bank account number format
    if (formValue.bankAccount && !formValue.bankAccount.match(/^\d{8,20}$/)) {
      this.validationErrors.push('Bank account number must be 8-20 digits');
      isValid = false;
    }

    // Validate username
    if (!this.validationService.validateUsername(formValue.username)) {
      this.validationErrors.push('Username must be 3-20 characters, alphanumeric and underscores only');
      isValid = false;
    }

    // Validate password strength
    const passwordValidation = this.passwordSecurity.validatePassword(formValue.password);
    if (!passwordValidation.isValid) {
      this.validationErrors.push('Password does not meet security requirements');
      passwordValidation.requirements.forEach(req => {
        if (!req.met) {
          this.validationErrors.push(`• ${req.label}`);
        }
      });
      isValid = false;
    }

    return isValid;
  }

  private sanitizeFormData(): any {
    const formValue = this.employeeForm.value;
    
    return {
      name: this.validationService.sanitizeInput(formValue.employeeName), // employeeName -> name
      email: this.validationService.sanitizeInput(formValue.employeeEmail), // employeeEmail -> email
      workLocation: this.validationService.sanitizeInput(formValue.workLocation),
      department: this.validationService.sanitizeInput(formValue.department),
      role: this.validationService.sanitizeInput(formValue.role),
      position: this.validationService.sanitizeInput(formValue.designation), // designation -> position
      joinDate: formValue.joiningDate, // joiningDate -> joinDate
      bankAccount: this.validationService.sanitizeInput(formValue.bankAccount),
      uanNumber: this.validationService.sanitizeInput(formValue.uanNumber),
      esiNumber: this.validationService.sanitizeInput(formValue.esiNumber),
      panNumber: this.validationService.sanitizeInput(formValue.panNumber),
      resourceType: this.validationService.sanitizeInput(formValue.resourceType),
      username: this.validationService.sanitizeInput(formValue.username),
      password: formValue.password, // Password should not be sanitized, only validated
      address: this.validationService.sanitizeInput(formValue.address),
      phone: this.validationService.sanitizeInput(formValue.phone)
    };
  }

  getPasswordStrengthText(): string {
    return this.passwordSecurity.getStrengthLevel(this.employeeForm.get('password')?.value || '');
  }

  getPasswordStrengthColor(): string {
    return this.passwordSecurity.getStrengthColor(this.passwordStrength);
  }

  // Method to check if a specific field has errors and is touched
  hasFieldError(fieldName: string): boolean {
    const field = this.employeeForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  // Method to get specific error message for a field
  getFieldError(fieldName: string, errorType: string): boolean {
    const field = this.employeeForm.get(fieldName);
    return !!(field && field.errors && field.errors[errorType] && field.touched);
  }

  // Clear validation errors when user starts typing
  clearValidationErrors(): void {
    this.validationErrors = [];
  }

  // Scroll to the first error field for better UX
  private scrollToFirstError(): void {
    setTimeout(() => {
      const firstErrorField = document.querySelector('.admin-input.error');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        (firstErrorField as HTMLInputElement).focus();
      }
    }, 100);
  }
}
