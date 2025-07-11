import { Component, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { EmployeeService, Employee } from '../../core/services/employee.service';
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
    staffAdvance: 0
  };

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
      // Get the payslip document element
      const payslipElement = document.querySelector('.payslip-document') as HTMLElement;
      if (!payslipElement) {
        alert('Payslip document not found. Please try again.');
        return;
      }

      // Show loading indicator
      this.isLoading.set(true);

      // Temporarily add a class to force PDF-friendly styling
      payslipElement.classList.add('pdf-generation');
      
      // Small delay to ensure styles are applied
      await new Promise(resolve => setTimeout(resolve, 100));

      // Configure html2canvas options for better quality
      const canvas = await html2canvas(payslipElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: payslipElement.scrollWidth,
        height: payslipElement.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });

      // Remove the temporary class
      payslipElement.classList.remove('pdf-generation');

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Add the first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      pdf.save(filename);

      // Hide loading indicator
      this.isLoading.set(false);

      console.log('PDF generated and downloaded successfully');
    } catch (error) {
      this.isLoading.set(false);
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
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
        staffAdvance: 0
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
        staffAdvance: 0
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
