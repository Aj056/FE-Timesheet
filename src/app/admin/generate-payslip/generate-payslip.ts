import { Component, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { EmployeeService } from '../../core/services/employee.service';
import { Employee } from '../../core/interfaces/common.interfaces';
import { ToastService } from '../../core/services/toast.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PayslipData {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  designation: string;
  workLocation: string;
  dateOfJoining: string;
  bankAccount: string;
  uanNumber: string;
  esiNumber: string;
  panNumber: string;
  month: string;
  year: number;
  lopDays: number;
  workedDays: number;
  basicSalary: number;
  hra: number;
  others: number;
  incentive: number;
  pf: number;
  esi: number;
  tds: number;
  staffAdvance: number;
  resourceType: string;
}

@Component({
  selector: 'app-generate-payslip',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './generate-payslip.html',
  styleUrls: ['./generate-payslip.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GeneratePayslipComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private employeeService = inject(EmployeeService);
  private toastService = inject(ToastService);

  employee = signal<Employee | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Current date for payslip generation
  currentDate = new Date();
  currentMonth = this.currentDate.toLocaleString('default', { month: 'long' });
  currentYear = this.currentDate.getFullYear();

  // Payslip data with default values
  payslipData: PayslipData = {
    employeeId: '',
    employeeName: '',
    employeeEmail: '',
    department: 'Software Development',
    designation: 'Software Developer',
    workLocation: 'Bangalore',
    dateOfJoining: '01.02.2024',
    bankAccount: '77770142435888',
    uanNumber: 'NA',
    esiNumber: 'N/A',
    panNumber: 'CSPPA0064D',
    month: this.currentMonth,
    year: this.currentYear,
    lopDays: 0.00,
    workedDays: 30,
    basicSalary: 6000,
    hra: 2400,
    others: 3600,
    incentive: 0,
    pf: 0,
    esi: 0,
    tds: 0,
    staffAdvance: 0,
    resourceType: 'payslip'
  };
  years = [2024, 2025, 2026];
  months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];


  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    console.log('Employee ID from route:', id);
    
    if (id) {
      this.loadEmployee(id);
    } else {
      console.error('No employee ID provided in the route parameters.');
      this.error.set('No employee ID provided');
      // Set default values even without employee ID
      this.payslipData.employeeId = 'UNKNOWN';
      this.payslipData.employeeName = 'Unknown Employee';
      this.payslipData.employeeEmail = 'unknown@company.com';
    }
  }

  private loadEmployee(id: string): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.employeeService.getEmployeeById(id).subscribe({
      next: (employee: Employee | null) => {
        this.employee.set(employee);
        this.isLoading.set(false);
        
        if (employee) {
          // Pre-populate payslip data with employee details using correct mapping
          this.payslipData.employeeId = employee.id || 'UNKNOWN';
          this.payslipData.employeeName = employee.name || 'Unknown Employee';
          this.payslipData.employeeEmail = employee.email || 'unknown@company.com';
          this.payslipData.department = employee.department || 'Software Development';
          this.payslipData.designation = employee.designation || employee.role || 'Software Developer';
          this.payslipData.workLocation = employee.workLocation || 'Bangalore';
          this.payslipData.resourceType = employee.resourceType || 'payslip';
          console.log('Resource Type:', this.payslipData.resourceType);
          // Format joining date from employee data
          if (employee.joiningDate) {
            const joiningDate = new Date(employee.joiningDate);
            this.payslipData.dateOfJoining = joiningDate.toLocaleDateString('en-GB').replace(/\//g, '.');
          } else {
            this.payslipData.dateOfJoining = '01.02.2024';
          }
          
          // Use employee's actual financial data
          this.payslipData.bankAccount = employee.bankAccount || '77770142435888';
          this.payslipData.uanNumber = employee.uanNumber || 'NA';
          this.payslipData.esiNumber = employee.esiNumber || 'N/A';
          this.payslipData.panNumber = employee.panNumber || 'CSPPA0064D';
          
          console.log('Employee details loaded for payslip:', employee);
        } else {
          this.error.set('Employee not found');
          // Set fallback values
          this.payslipData.employeeId = id;
          this.payslipData.employeeName = 'Employee Not Found';
          this.payslipData.employeeEmail = 'unknown@company.com';
        }
      },
      error: (error) => {
        console.error('Error fetching employee details:', error);
        this.error.set('Failed to load employee details');
        this.isLoading.set(false);
        // Set fallback values even on error
        this.payslipData.employeeId = id;
        this.payslipData.employeeName = 'Employee (Data Load Failed)';
        this.payslipData.employeeEmail = 'unknown@company.com';
      }
    });
  }

  // Calculate gross salary (Total Earnings)
  get grossSalary(): number {
    return this.payslipData.basicSalary + 
           this.payslipData.hra + 
           this.payslipData.others + 
           this.payslipData.incentive + 
           this.payslipData.pf;
  }

  // Calculate total deductions
  get totalDeductions(): number {
    return this.payslipData.pf + 
           this.payslipData.esi + 
           this.payslipData.tds + 
           this.payslipData.staffAdvance;
  }

  // Calculate net salary
  get netSalary(): number {
    return this.grossSalary - this.totalDeductions;
  }

  // Calculate actual salary based on days worked (LOP consideration)
  get actualSalary(): number {
    const totalDays = 30; // Standard month
    const actualWorkingDays = totalDays - this.payslipData.lopDays;
    const dailyRate = this.grossSalary / totalDays;
    return dailyRate * actualWorkingDays;
  }

  // Calculate final net salary
  get finalNetSalary(): number {
    return this.actualSalary - this.totalDeductions;
  }

  // Download payslip as PDF
  downloadPayslip(): void {
    console.log('Download payslip called with data:', this.payslipData);
    
    // Validate required data before proceeding
    if (!this.payslipData.employeeName || this.payslipData.employeeName.trim() === '') {
      console.error('Employee name is required for payslip generation');
      alert('Please wait for employee data to load before downloading the payslip.');
      return;
    }

    try {
      // Create filename
      const employeeName = (this.payslipData.employeeName || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
      const month = this.payslipData.month || 'Unknown';
      const year = this.payslipData.year || new Date().getFullYear();
      const filename = `Payslip_${employeeName}_${month}_${year}.pdf`;

      // Generate PDF using html2canvas and jsPDF
      this.generatePDF(filename);
      
    } catch (error) {
      console.error('Error during PDF generation:', error);
      alert('An error occurred while generating the PDF. Please try again.');
    }
  }

  private async generatePDF(filename: string): Promise<void> {
    try {
      // Get the payslip document element with more robust selection
      let payslipElement = document.querySelector('.payslip-document') as HTMLElement;
      
      if (!payslipElement) {
        // Try alternative selectors if main one fails
        payslipElement = document.querySelector('.payslip-container') as HTMLElement;
        if (!payslipElement) {
          payslipElement = document.querySelector('#payslip-content') as HTMLElement;
        }
      }
      
      if (!payslipElement) {
        console.error('Payslip element not found');
        alert('Unable to locate payslip content. Please ensure the payslip is fully loaded.');
        return;
      }

      // Show loading indicator
      this.isLoading.set(true);

      // Ensure element is visible and scrolled into view
      payslipElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Wait for scroll and rendering
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create a clone for PDF generation to avoid affecting the original
      const clonedElement = payslipElement.cloneNode(true) as HTMLElement;
      clonedElement.style.position = 'absolute';
      clonedElement.style.left = '-9999px';
      clonedElement.style.top = '0';
      clonedElement.style.width = '800px'; // Fixed width for consistency
      clonedElement.style.background = '#ffffff';
      clonedElement.style.color = '#000000';
      clonedElement.style.padding = '20px';
      clonedElement.style.boxShadow = 'none';
      clonedElement.style.transform = 'none';
      clonedElement.style.fontSize = '14px';
      clonedElement.style.fontFamily = 'Arial, sans-serif';
      clonedElement.classList.add('pdf-generation');
      
      // Force all text to be black and backgrounds to be white
      const allElements = clonedElement.querySelectorAll('*') as NodeListOf<HTMLElement>;
      allElements.forEach(el => {
        el.style.color = '#000000';
        el.style.backgroundColor = 'transparent';
        el.style.boxShadow = 'none';
        el.style.textShadow = 'none';
        el.style.transform = 'none';
        
        // Ensure headers have proper styling
        if (el.classList.contains('payslip-header')) {
          el.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
          el.style.color = '#ffffff';
        }
        
        // Ensure proper table styling
        if (el.tagName === 'TABLE' || el.classList.contains('earnings-section') || el.classList.contains('deductions-section')) {
          el.style.border = '1px solid #e5e7eb';
          el.style.backgroundColor = '#ffffff';
        }
      });
      
      // Append clone to body temporarily
      document.body.appendChild(clonedElement);
      
      // Wait for clone to render
      await new Promise(resolve => setTimeout(resolve, 200));

      // Configure html2canvas with optimal settings for cloned element
      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: clonedElement.scrollWidth || 800,
        height: clonedElement.scrollHeight || 1200,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          // Ensure all styles are properly applied in the clone
          const clonedPayslip = clonedDoc.querySelector('.pdf-generation');
          if (clonedPayslip) {
            (clonedPayslip as HTMLElement).style.transform = 'none';
            (clonedPayslip as HTMLElement).style.position = 'static';
          }
        }
      });

      // Remove the temporary clone
      document.body.removeChild(clonedElement);

      // Validate canvas
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Failed to generate canvas from HTML content');
      }

      // Calculate PDF dimensions (A4)
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Create PDF with better quality settings
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      let position = 0;
      const imgData = canvas.toDataURL('image/jpeg', 0.95); // Use JPEG with high quality

      // Add the first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      pdf.save(filename);

      // Hide loading indicator
      this.isLoading.set(false);

      // Success notification
      this.toastService.success({
        title: 'PDF Generated',
        message: `Payslip PDF has been downloaded successfully: ${filename}`,
        duration: 3000
      });

      console.log('PDF generated and downloaded successfully');
    } catch (error) {
      this.isLoading.set(false);
      console.error('Error generating PDF:', error);
      
      // More descriptive error handling
      let errorMessage = 'An unexpected error occurred while generating the PDF.';
      if (error instanceof Error) {
        if (error.message.includes('canvas')) {
          errorMessage = 'Failed to capture payslip content. Please try refreshing the page.';
        } else if (error.message.includes('clone')) {
          errorMessage = 'Unable to process payslip content. Please ensure all data is loaded.';
        } else {
          errorMessage = `PDF generation failed: ${error.message}`;
        }
      }
      
      alert(errorMessage + ' If the problem persists, please contact IT support.');
    }
  }

  // Go back to employee details
  goBack(): void {
    const employeeId = this.employee()?.id;
    if (employeeId) {
      this.router.navigate(['/admin/employee-details', employeeId]);
    } else {
      this.router.navigate(['/admin/employees']);
    }
  }

  // Preview payslip in a new window
  previewPayslip(): void {
    const payslipElement = document.querySelector('.payslip-document') as HTMLElement;
    if (!payslipElement) {
      alert('Payslip document not found. Please try again.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    if (printWindow) {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payslip Preview - ${this.payslipData.employeeName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .no-print { display: block; margin-bottom: 20px; }
            .print-btn { 
              background: #2563eb; 
              color: white; 
              padding: 10px 20px; 
              border: none; 
              border-radius: 4px; 
              cursor: pointer; 
              margin-right: 10px;
            }
            .print-btn:hover { background: #1d4ed8; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button class="print-btn" onclick="window.print()">Print Payslip</button>
            <button class="print-btn" onclick="window.close()">Close</button>
          </div>
          ${payslipElement.outerHTML}
        </body>
        </html>
      `;
      
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      alert('Please allow popups to preview the payslip.');
    }
  }

  // Reset form to default values
  resetForm(): void {
    const currentEmployee = this.employee();
    if (currentEmployee) {
      this.payslipData = {
        employeeId: currentEmployee.id || 'UNKNOWN',
        employeeName: currentEmployee.name || 'Unknown Employee',
        employeeEmail: currentEmployee.email || 'unknown@company.com',
        department: currentEmployee.department || 'Software Development',
        designation: currentEmployee.role || 'Software Developer',
        workLocation: 'Bangalore',
        dateOfJoining: '01.02.2024',
        bankAccount: '77770142435888',
        uanNumber: 'NA',
        esiNumber: 'N/A',
        panNumber: 'CSPPA0064D',
        month: this.currentMonth,
        year: this.currentYear,
        lopDays: 0.00,
        workedDays: 30,
        basicSalary: 6000,
        hra: 2400,
        others: 3600,
        incentive: 0,
        pf: 0,
        esi: 0,
        tds: 0,
        staffAdvance: 0,
        resourceType: 'payslip'
      };
    } else {
      // Reset to defaults if no employee data
      this.payslipData = {
        employeeId: this.payslipData.employeeId || 'UNKNOWN',
        employeeName: this.payslipData.employeeName || 'Unknown Employee',
        employeeEmail: this.payslipData.employeeEmail || 'unknown@company.com',
        department: 'Software Development',
        designation: 'Software Developer',
        workLocation: 'Bangalore',
        dateOfJoining: '01.02.2024',
        bankAccount: '77770142435888',
        uanNumber: 'NA',
        esiNumber: 'N/A',
        panNumber: 'CSPPA0064D',
        month: this.currentMonth,
        year: this.currentYear,
        lopDays: 0.00,
        workedDays: 30,
        basicSalary: 6000,
        hra: 2400,
        others: 3600,
        incentive: 0,
        pf: 0,
        esi: 0,
        tds: 0,
        staffAdvance: 0,
        resourceType: 'payslip'
      };
    }
  }

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }
}
