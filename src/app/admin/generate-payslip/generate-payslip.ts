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

  // Manual override values for totals
  manualTotalEarnings: number = 0;
  manualTotalDeductions: number = 0;
  editableNetPay: number = 0;
  useManualTotals: boolean = false;
  years = [2024, 2025, 2026, 2027];
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
    
    // Initialize manual totals with calculated values
    this.initializeManualTotals();
    
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
          this.payslipData.employeeId = employee._id || 'UNKNOWN';
          this.payslipData.employeeName = employee.employeeName || 'Unknown Employee';
          this.payslipData.employeeEmail = employee.employeeEmail || 'unknown@company.com';
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
          
          // Initialize manual totals after employee data is loaded
          this.initializeManualTotals();
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

  // Initialize manual totals with calculated values
  initializeManualTotals(): void {
    this.manualTotalEarnings = this.grossSalary;
    this.manualTotalDeductions = this.totalDeductions;
    this.editableNetPay = this.calculatedNetPay;
  }

  // Handle manual total earnings change
  onTotalEarningsChange(): void {
    this.useManualTotals = true;
  }

  // Handle manual total deductions change
  onTotalDeductionsChange(): void {
    this.useManualTotals = true;
  }

  // Update manual totals when salary fields change
  updateManualTotals(): void {
    if (!this.useManualTotals) {
      this.manualTotalEarnings = this.grossSalary;
      this.manualTotalDeductions = this.totalDeductions;
      this.editableNetPay = this.calculatedNetPay;
    }
  }

  // Get total earnings (manual or calculated)
  get finalTotalEarnings(): number {
    return this.useManualTotals ? this.manualTotalEarnings : this.grossSalary;
  }

  // Get total deductions (manual or calculated)
  get finalTotalDeductions(): number {
    return this.useManualTotals ? this.manualTotalDeductions : this.totalDeductions;
  }

  // Calculate net pay based on manual or calculated totals
  get calculatedNetPay(): number {
    return this.finalTotalEarnings - this.finalTotalDeductions;
  }

  // Calculate gross salary (Total Earnings) - fixed calculation
  get grossSalary(): number {
    const basic = Number(this.payslipData.basicSalary) || 0;
    const hra = Number(this.payslipData.hra) || 0;
    const others = Number(this.payslipData.others) || 0;
    const incentive = Number(this.payslipData.incentive) || 0;
    
    // PF should NOT be included in total earnings - it's a deduction
    return basic + hra + others + incentive;
  }

  // Calculate total deductions - fixed calculation
  get totalDeductions(): number {
    const pf = Number(this.payslipData.pf) || 0;
    const esi = Number(this.payslipData.esi) || 0;
    const tds = Number(this.payslipData.tds) || 0;
    const staffAdvance = Number(this.payslipData.staffAdvance) || 0;
    
    return pf + esi + tds + staffAdvance;
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
      const month = (this.payslipData.month || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
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

      // Ensure month and year values are properly set before cloning
      console.log('Current month/year values:', this.payslipData.month, this.payslipData.year);
      
      // Force update month/year input values in the DOM before cloning
      const monthInput = payslipElement.querySelector('input[type="text"].month-year-input') as HTMLInputElement;
      const yearInput = payslipElement.querySelector('input[type="number"].month-year-input') as HTMLInputElement;
      
      if (monthInput) {
        monthInput.value = this.payslipData.month || 'July';
      }
      if (yearInput) {
        yearInput.value = this.payslipData.year?.toString() || '2025';
      }

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
      clonedElement.style.lineHeight = '1.4';
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
          el.style.background = 'white';
          el.style.color = '#000000';
          el.style.border = '2px solid #000';
          el.style.textAlign = 'center';
          el.style.padding = '20px';
        }
        
        // Ensure proper table styling
        if (el.tagName === 'TABLE' || el.classList.contains('earnings-section') || el.classList.contains('deductions-section')) {
          el.style.border = '1px solid #e5e7eb';
          el.style.backgroundColor = '#ffffff';
        }

        // Style the payslip title properly
        if (el.classList.contains('payslip-title-text')) {
          el.style.fontSize = '16px';
          el.style.fontWeight = 'bold';
          el.style.color = '#000';
          el.style.textAlign = 'center';
          el.style.margin = '10px 0';
        }

        // Style the month-year container
        if (el.classList.contains('month-year-container')) {
          el.style.display = 'inline';
          el.style.margin = '0 8px';
        }

        // Style the separator
        if (el.classList.contains('separator')) {
          el.style.margin = '0 4px';
          el.style.fontWeight = 'bold';
        }

        // Style company details
        if (el.classList.contains('company-details')) {
          el.style.textAlign = 'center';
          el.style.padding = '20px';
        }

        // Style company name
        if (el.classList.contains('company-name')) {
          el.style.fontSize = '18px';
          el.style.fontWeight = 'bold';
          el.style.color = '#000';
          el.style.margin = '8px 0';
        }

        // Style company address
        if (el.classList.contains('company-address')) {
          el.style.fontSize = '14px';
          el.style.color = '#000';
          el.style.margin = '8px 0';
        }

        // Handle select elements for PDF (if any remain)
        if (el.tagName === 'SELECT') {
          const select = el as HTMLSelectElement;
          let selectedText = '';
          
          selectedText = select.options[select.selectedIndex]?.text || select.value;
          
          const span = document.createElement('span');
          span.textContent = selectedText;
          span.style.fontWeight = '600';
          span.style.color = '#000';
          span.style.fontSize = '14px';
          span.style.padding = '0';
          span.style.margin = '0';
          el.parentNode?.replaceChild(span, el);
        }

        // Handle input elements for PDF
        if (el.tagName === 'INPUT') {
          const input = el as HTMLInputElement;
          const span = document.createElement('span');
          
          // Get the actual value, handling different input types
          let displayValue = input.value || '';
          
          // Special handling for month/year inputs - ensure values are from component data
          if (input.classList.contains('month-year-input')) {
            if (input.type === 'text') {
              displayValue = this.payslipData.month || 'July';
            } else if (input.type === 'number') {
              displayValue = this.payslipData.year?.toString() || '2025';
            }
          }
          
          // Special formatting for certain fields
          if (input.type === 'number' && displayValue && !input.classList.contains('month-year-input')) {
            // For number inputs, ensure proper formatting
            displayValue = parseFloat(displayValue).toString();
          }
          
          span.textContent = displayValue;
          span.style.fontWeight = input.classList.contains('total-amount-input') ? 'bold' : 'normal';
          span.style.color = '#000';
          span.style.fontSize = '14px';
          span.style.padding = '0';
          span.style.margin = '0';
          
          // Special styling for different input types
          if (input.classList.contains('total-amount-input') || input.classList.contains('amount-input-net')) {
            span.style.textAlign = 'right';
            span.style.display = 'inline-block';
            span.style.minWidth = '80px';
            span.style.fontWeight = 'bold';
          }
          
          if (input.classList.contains('month-year-input')) {
            span.style.textAlign = 'center';
            span.style.display = 'inline-block';
            span.style.fontWeight = '600';
            span.style.minWidth = '60px';
          }
          
          el.parentNode?.replaceChild(span, el);
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
    const employeeId = this.employee()?._id;
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
        employeeId: currentEmployee._id || 'UNKNOWN',
        employeeName: currentEmployee.employeeName || 'Unknown Employee',
        employeeEmail: currentEmployee.employeeEmail || 'unknown@company.com',
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
    
    // Reset manual totals
    this.useManualTotals = false;
    this.initializeManualTotals();
  }

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }
}
