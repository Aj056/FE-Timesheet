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
  isPdfGenerating = signal(false);

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
  isEditingMonthYear: boolean = false;
  selectedMonth: number = this.currentDate.getMonth() + 1;
  selectedYear: number = this.currentYear;
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
    
    // Ensure month and year are properly set
    if (!this.payslipData.month || this.payslipData.month.trim() === '') {
      this.payslipData.month = this.currentMonth;
    }
    if (!this.payslipData.year || this.payslipData.year === 0) {
      this.payslipData.year = this.currentYear;
    }
    
    console.log('Initial month/year values:', this.payslipData.month, this.payslipData.year);
    
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

  // Get month name from number
  getMonthName(monthNum: number): string {
    const month = this.months.find(m => m.value === monthNum);
    return month ? month.label : 'January';
  }

  // Handle month/year changes
  onMonthYearChange(): void {
    this.payslipData.month = this.getMonthName(this.selectedMonth);
    this.payslipData.year = this.selectedYear;
  }

  // Toggle month/year editing mode
  toggleMonthYearEdit(): void {
    this.isEditingMonthYear = !this.isEditingMonthYear;
    
    // Ensure the values are properly set
    if (!this.isEditingMonthYear) {
      console.log('Exiting edit mode, current values:', this.payslipData.month, this.payslipData.year);
    }
  }

  // Handle Enter key pressed
  onEnterPressed(event: any): void {
    event.preventDefault();
    if (event.target && typeof event.target.blur === 'function') {
      event.target.blur();
    }
  }

  // Handle contenteditable input for month (real-time)
  onMonthInput(event: any): void {
    const newMonth = event.target.textContent || event.target.innerText;
    if (newMonth && newMonth.trim()) {
      this.payslipData.month = newMonth.trim();
    }
  }

  // Handle contenteditable input for year (real-time)
  onYearInput(event: any): void {
    const newYear = event.target.textContent || event.target.innerText;
    if (newYear && newYear.trim()) {
      const yearNum = parseInt(newYear.trim());
      if (!isNaN(yearNum) && yearNum > 1999 && yearNum < 3000) {
        this.payslipData.year = yearNum;
      }
    }
  }

  // Handle contenteditable changes for month
  onMonthChange(event: any): void {
    const newMonth = event.target.textContent || event.target.innerText;
    if (newMonth && newMonth.trim()) {
      this.payslipData.month = newMonth.trim();
      console.log('Month changed to:', this.payslipData.month);
    } else {
      // Reset to current month if empty
      this.payslipData.month = this.currentMonth;
      event.target.textContent = this.payslipData.month;
    }
  }

  // Handle contenteditable changes for year
  onYearChange(event: any): void {
    const newYear = event.target.textContent || event.target.innerText;
    if (newYear && newYear.trim()) {
      const yearNum = parseInt(newYear.trim());
      if (!isNaN(yearNum) && yearNum > 1999 && yearNum < 3000) {
        this.payslipData.year = yearNum;
        console.log('Year changed to:', this.payslipData.year);
      } else {
        // Reset to current year if invalid
        this.payslipData.year = this.currentYear;
        event.target.textContent = this.payslipData.year.toString();
      }
    } else {
      // Reset to current year if empty
      this.payslipData.year = this.currentYear;
      event.target.textContent = this.payslipData.year.toString();
    }
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
      console.log('Starting PDF generation for:', filename);
      console.log('Current component state:', {
        isLoading: this.isLoading(),
        error: this.error(),
        hasEmployee: !!this.employee(),
        employeeName: this.payslipData.employeeName
      });
      
      // Ensure component is in the right state for PDF generation
      if (this.isLoading()) {
        console.warn('Component is still loading, waiting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (this.error()) {
        console.error('Component has error state:', this.error());
        alert('Cannot generate PDF while there is an error. Please resolve the error first.');
        return;
      }

      // Get the payslip document element with better detection
      let payslipElement: HTMLElement | null = null;
      const selectors = [
        '.payslip-document',
        '.payslip-container .payslip-document',
        '[class*="payslip-document"]',
        '.payslip-container',
        '#payslip-content'
      ];
      
      for (const selector of selectors) {
        payslipElement = document.querySelector(selector) as HTMLElement;
        if (payslipElement) {
          console.log(`Found payslip element with selector: ${selector}`);
          break;
        }
      }
      
      if (!payslipElement) {
        console.error('Payslip element not found with any selector. Available elements:');
        console.log('All payslip-related elements:', document.querySelectorAll('[class*="payslip"]'));
        console.log('All elements in container:', document.querySelector('.payslip-container')?.children);
        alert('Unable to locate payslip content. Please ensure the payslip is fully loaded and visible.');
        return;
      }

      console.log('Found payslip element:', {
        className: payslipElement.className,
        tagName: payslipElement.tagName,
        id: payslipElement.id
      });

      // Show PDF generation indicator (don't use main loading flag as it hides the payslip!)
      this.isPdfGenerating.set(true);

      // Temporarily exit edit mode for PDF generation to show display spans
      const wasEditing = this.isEditingMonthYear;
      this.isEditingMonthYear = false;
      console.log('Set editing mode to false, was editing:', wasEditing);
      console.log('Current month/year values:', this.payslipData.month, this.payslipData.year);

      // Wait for DOM updates and ensure element is properly rendered
      await new Promise(resolve => setTimeout(resolve, 500));

      // Force element visibility and layout
      const originalStyle = {
        display: payslipElement.style.display,
        visibility: payslipElement.style.visibility,
        opacity: payslipElement.style.opacity,
        position: payslipElement.style.position
      };

      // Ensure element is visible
      payslipElement.style.display = 'block';
      payslipElement.style.visibility = 'visible';
      payslipElement.style.opacity = '1';
      payslipElement.style.position = 'static';

      // Add PDF generation class for styling
      payslipElement.classList.add('pdf-generation');
      console.log('Added pdf-generation class');

      // Wait for style changes to take effect
      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify element dimensions
      const rect = payslipElement.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(payslipElement);
      console.log('Element dimensions:', {
        boundingRect: { width: rect.width, height: rect.height },
        offsetDimensions: { width: payslipElement.offsetWidth, height: payslipElement.offsetHeight },
        scrollDimensions: { width: payslipElement.scrollWidth, height: payslipElement.scrollHeight },
        computedDisplay: computedStyle.display,
        computedVisibility: computedStyle.visibility,
        computedOpacity: computedStyle.opacity
      });

      if (rect.width === 0 || rect.height === 0) {
        console.warn(`Payslip element has zero dimensions: ${rect.width}x${rect.height}. Trying fallback approach...`);
        
        // Try to restore original styles
        Object.assign(payslipElement.style, originalStyle);
        payslipElement.classList.remove('pdf-generation');
        
        // Fallback: Try to find a parent container or use the form container
        const fallbackSelectors = [
          '.payslip-container',
          '.form-container',
          'form',
          '.content'
        ];
        
        for (const fallbackSelector of fallbackSelectors) {
          const fallbackElement = document.querySelector(fallbackSelector) as HTMLElement;
          if (fallbackElement) {
            const fallbackRect = fallbackElement.getBoundingClientRect();
            console.log(`Trying fallback element: ${fallbackSelector}`, {
              width: fallbackRect.width,
              height: fallbackRect.height
            });
            
            if (fallbackRect.width > 0 && fallbackRect.height > 0) {
              console.log(`Using fallback element: ${fallbackSelector}`);
              payslipElement = fallbackElement;
              
              // Apply the same visibility fixes to the fallback element
              payslipElement.style.display = 'block';
              payslipElement.style.visibility = 'visible';
              payslipElement.style.opacity = '1';
              payslipElement.style.position = 'static';
              payslipElement.classList.add('pdf-generation');
              
              // Wait for changes to take effect
              await new Promise(resolve => setTimeout(resolve, 200));
              
              const newRect = payslipElement.getBoundingClientRect();
              console.log('Fallback element final dimensions:', newRect.width, 'x', newRect.height);
              
              if (newRect.width > 0 && newRect.height > 0) {
                break; // Success with fallback
              }
            }
          }
        }
        
        // Final check after fallback attempts
        const finalRect = payslipElement.getBoundingClientRect();
        if (finalRect.width === 0 || finalRect.height === 0) {
          throw new Error(`All elements have zero dimensions. Final attempt: ${finalRect.width}x${finalRect.height}. 
          
          Possible causes:
          1. The payslip content is hidden by CSS
          2. Angular *ngIf conditions are preventing content from rendering
          3. The page is still loading employee data
          
          Please ensure:
          - Employee data is loaded (check for loading states)
          - The payslip content is visible on screen
          - No CSS rules are hiding the content`);
        }
      }

      // Configure html2canvas with optimal settings
      console.log('Starting html2canvas capture...');
      const canvas = await html2canvas(payslipElement, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: payslipElement.scrollWidth,
        height: payslipElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        removeContainer: false,
        logging: true // Enable logging for debugging
      });

      console.log('Canvas created:', canvas.width, 'x', canvas.height);

      // Remove PDF generation class
      payslipElement.classList.remove('pdf-generation');

      // Restore edit mode if it was active
      this.isEditingMonthYear = wasEditing;

      // Validate canvas
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error(`Invalid canvas dimensions: ${canvas?.width || 0}x${canvas?.height || 0}`);
      }

      const imgData = canvas.toDataURL('image/png', 1.0);
      console.log('Image data created, length:', imgData.length);
      
      // Create PDF with proper orientation and sizing
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate image dimensions to fit page
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      console.log('PDF dimensions:', imgWidth, 'x', imgHeight);
      
      let heightLeft = imgHeight;
      let position = 10; // 10mm top margin

      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20); // Account for top and bottom margins

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }

      // Save the PDF
      console.log('Saving PDF...');
      pdf.save(filename);
      
      console.log(`PDF saved successfully: ${filename}`);
      
      // Success notification
      this.toastService.success({
        title: 'PDF Generated',
        message: `Payslip PDF has been downloaded successfully: ${filename}`,
        duration: 3000
      });

    } catch (error) {
      console.error('Detailed PDF generation error:', error);
      console.error('Error stack:', (error as Error)?.stack);
      
      let errorMessage = 'PDF generation failed: ';
      if (error instanceof Error) {
        errorMessage += error.message;
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      } else {
        errorMessage += 'Unknown error occurred';
        console.error('Non-Error object thrown:', error);
      }
      
      alert(errorMessage + '\n\nPlease check the browser console for more details.');
    } finally {
      this.isPdfGenerating.set(false);
      
      // Ensure PDF generation class is removed
      const payslipElement = document.querySelector('.payslip-document, .payslip-container, #payslip-content') as HTMLElement;
      if (payslipElement) {
        payslipElement.classList.remove('pdf-generation');
      }
      
      console.log('PDF generation cleanup completed');
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
