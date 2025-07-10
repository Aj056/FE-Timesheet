import { Component, OnInit, signal, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PayslipService, PayslipInfo, PayslipRequest } from '../../core/services/payslip.service';
import { Authservice } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-payslip-download',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payslip-container">
      <!-- Header -->
      <div class="payslip-header">
        <div class="header-title">
          <h2 class="title">Download Payslip</h2>
          <p class="subtitle">Select month and year to download your payslip</p>
        </div>
        <div class="header-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
        </div>
      </div>

      <!-- Selection Form -->
      <div class="selection-form">
        <div class="form-row">
          <div class="form-group">
            <label for="month-select" class="form-label">Month</label>
            <select 
              id="month-select" 
              [(ngModel)]="selectedMonth" 
              (ngModelChange)="onSelectionChange()"
              class="form-select">
              <option value="">Select Month</option>
              <option *ngFor="let month of months" [value]="month.value">
                {{ month.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="year-select" class="form-label">Year</label>
            <select 
              id="year-select" 
              [(ngModel)]="selectedYear" 
              (ngModelChange)="onSelectionChange()"
              class="form-select">
              <option value="">Select Year</option>
              <option *ngFor="let year of availableYears" [value]="year">
                {{ year }}
              </option>
            </select>
          </div>

          <div class="form-actions">
            <button 
              class="btn btn-primary"
              [disabled]="!canCheckStatus() || isLoading()"
              (click)="checkPayslipStatus()">
              <span *ngIf="isLoading()" class="spinner"></span>
              <svg *ngIf="!isLoading()" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              Check Status
            </button>
          </div>
        </div>
      </div>

      <!-- Status Display -->
      <div *ngIf="payslipStatus()" class="status-section">
        <div class="status-card" [ngClass]="getStatusClass(payslipStatus()!.status)">
          <div class="status-icon">
            <ng-container [ngSwitch]="payslipStatus()!.status">
              <!-- Available -->
              <svg *ngSwitchCase="'available'" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <!-- Processing -->
              <svg *ngSwitchCase="'processing'" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <!-- Not Available -->
              <svg *ngSwitchCase="'not_available'" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
              <!-- Not Generated -->
              <svg *ngSwitchCase="'not_generated'" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
              </svg>
            </ng-container>
          </div>
          
          <div class="status-content">
            <h3 class="status-title">{{ getStatusTitle(payslipStatus()!.status) }}</h3>
            <p class="status-message">{{ getStatusMessage() }}</p>
            
            <!-- Payslip Details for Available Status -->
            <div *ngIf="payslipStatus()!.status === 'available' && payslipStatus()!.grossSalary" class="payslip-details">
              <div class="detail-row">
                <span class="detail-label">Gross Salary:</span>
                <span class="detail-value">₹{{ payslipStatus()!.grossSalary | number:'1.2-2' }}</span>
              </div>
              <div class="detail-row" *ngIf="payslipStatus()!.netSalary">
                <span class="detail-label">Net Salary:</span>
                <span class="detail-value">₹{{ payslipStatus()!.netSalary | number:'1.2-2' }}</span>
              </div>
              <div class="detail-row" *ngIf="payslipStatus()!.generatedDate">
                <span class="detail-label">Generated On:</span>
                <span class="detail-value">{{ payslipStatus()!.generatedDate | date:'dd MMM yyyy' }}</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="status-actions">
            <button 
              *ngIf="payslipStatus()!.status === 'available'"
              class="btn btn-success"
              [disabled]="isDownloading()"
              (click)="downloadPayslip()">
              <span *ngIf="isDownloading()" class="spinner"></span>
              <svg *ngIf="!isDownloading()" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              Download Payslip
            </button>

            <button 
              *ngIf="payslipStatus()!.status === 'not_available' && !isFutureMonth()"
              class="btn btn-secondary"
              [disabled]="isRequesting()"
              (click)="requestPayslipGeneration()">
              <span *ngIf="isRequesting()" class="spinner"></span>
              <svg *ngIf="!isRequesting()" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 6l-1.41-1.41L12 10.17 8.41 6.59 7 8l5 5 5-5z"/>
              </svg>
              Request Generation
            </button>

            <button 
              class="btn btn-secondary"
              (click)="clearSelection()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
              Clear
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Payslips -->
      <div class="recent-section">
        <h3 class="section-title">Recent Payslips</h3>
        
        <div *ngIf="recentPayslips().length === 0 && !isLoadingRecent()" class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          <p>No payslips found</p>
        </div>

        <div *ngIf="isLoadingRecent()" class="loading-state">
          <div class="spinner"></div>
          <p>Loading recent payslips...</p>
        </div>

        <div class="payslip-list" *ngIf="recentPayslips().length > 0">
          <div 
            *ngFor="let payslip of recentPayslips()" 
            class="payslip-item"
            [ngClass]="'status-' + payslip.status">
            <div class="payslip-info">
              <h4 class="payslip-month">{{ getMonthName(payslip.month) }} {{ payslip.year }}</h4>
              <p class="payslip-status">{{ getStatusTitle(payslip.status) }}</p>
              <p *ngIf="payslip.netSalary" class="payslip-amount">₹{{ payslip.netSalary | number:'1.2-2' }}</p>
            </div>
            <div class="payslip-actions">
              <button 
                *ngIf="payslip.status === 'available'"
                class="btn btn-sm btn-primary"
                (click)="downloadSpecificPayslip(payslip)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './payslip-download.scss',
  encapsulation: ViewEncapsulation.None
})
export class PayslipDownloadComponent implements OnInit {
  // Signals
  selectedMonth = signal<number | null>(null);
  selectedYear = signal<number | null>(null);
  payslipStatus = signal<PayslipInfo | null>(null);
  recentPayslips = signal<PayslipInfo[]>([]);
  isLoading = signal(false);
  isDownloading = signal(false);
  isRequesting = signal(false);
  isLoadingRecent = signal(false);

  // Data
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

  availableYears: number[] = [];

  constructor(
    private payslipService: PayslipService,
    private authService: Authservice,
    private toastService: ToastService
  ) {
    this.availableYears = this.payslipService.getAvailableYears(3);
  }

  ngOnInit(): void {
    this.loadRecentPayslips();
  }

  canCheckStatus(): boolean {
    return this.selectedMonth() !== null && this.selectedYear() !== null;
  }

  onSelectionChange(): void {
    // Clear previous status when selection changes
    this.payslipStatus.set(null);
  }

  checkPayslipStatus(): void {
    if (!this.canCheckStatus()) return;

    const currentUserId = this.authService.getCurrentUserId();
    if (!currentUserId) {
      this.toastService.error({
        title: 'Authentication Error',
        message: 'Please log in to check payslip status',
        duration: 4000
      });
      return;
    }

    this.isLoading.set(true);
    
    const request: PayslipRequest = {
      employeeId: currentUserId,
      month: this.selectedMonth()!,
      year: this.selectedYear()!
    };

    this.payslipService.getPayslipStatus(request).subscribe({
      next: (status) => {
        this.payslipStatus.set(status);
        this.isLoading.set(false);
        
        this.toastService.info({
          title: 'Status Retrieved',
          message: this.payslipService.getStatusMessage(status.status, status.month, status.year),
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error checking payslip status:', error);
        this.isLoading.set(false);
        
        this.toastService.error({
          title: 'Error',
          message: 'Failed to check payslip status. Please try again.',
          duration: 4000
        });
      }
    });
  }

  downloadPayslip(): void {
    if (!this.payslipStatus() || this.payslipStatus()!.status !== 'available') return;

    this.isDownloading.set(true);
    
    const request: PayslipRequest = {
      employeeId: this.payslipStatus()!.employeeId,
      month: this.payslipStatus()!.month,
      year: this.payslipStatus()!.year
    };

    this.payslipService.downloadPayslip(request).subscribe({
      next: (response) => {
        if (response.success && response.url) {
          // Create download link
          const link = document.createElement('a');
          link.href = response.url;
          link.download = response.fileName || `payslip-${request.month}-${request.year}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          this.toastService.success({
            title: 'Download Started',
            message: 'Your payslip download has started',
            duration: 3000
          });
        } else {
          throw new Error(response.message || 'Download failed');
        }
        
        this.isDownloading.set(false);
      },
      error: (error) => {
        console.error('Error downloading payslip:', error);
        this.isDownloading.set(false);
        
        this.toastService.error({
          title: 'Download Failed',
          message: 'Failed to download payslip. Please try again.',
          duration: 4000
        });
      }
    });
  }

  requestPayslipGeneration(): void {
    if (!this.payslipStatus()) return;

    this.isRequesting.set(true);
    
    const request: PayslipRequest = {
      employeeId: this.payslipStatus()!.employeeId,
      month: this.payslipStatus()!.month,
      year: this.payslipStatus()!.year
    };

    this.payslipService.requestPayslipGeneration(request).subscribe({
      next: (response) => {
        this.isRequesting.set(false);
        
        if (response.success) {
          this.toastService.success({
            title: 'Request Submitted',
            message: response.message || 'Payslip generation requested successfully',
            duration: 4000
          });
          
          // Refresh status
          this.checkPayslipStatus();
        } else {
          throw new Error(response.message || 'Request failed');
        }
      },
      error: (error) => {
        console.error('Error requesting payslip generation:', error);
        this.isRequesting.set(false);
        
        this.toastService.error({
          title: 'Request Failed',
          message: 'Failed to request payslip generation. Please try again.',
          duration: 4000
        });
      }
    });
  }

  downloadSpecificPayslip(payslip: PayslipInfo): void {
    if (payslip.status !== 'available') return;

    this.payslipService.downloadPayslipFile(payslip.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payslip-${this.getMonthName(payslip.month)}-${payslip.year}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.toastService.success({
          title: 'Download Started',
          message: `Downloading payslip for ${this.getMonthName(payslip.month)} ${payslip.year}`,
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error downloading specific payslip:', error);
        this.toastService.error({
          title: 'Download Failed',
          message: 'Failed to download payslip. Please try again.',
          duration: 4000
        });
      }
    });
  }

  clearSelection(): void {
    this.selectedMonth.set(null);
    this.selectedYear.set(null);
    this.payslipStatus.set(null);
  }

  loadRecentPayslips(): void {
    const currentUserId = this.authService.getCurrentUserId();
    if (!currentUserId) return;

    this.isLoadingRecent.set(true);
    
    this.payslipService.getEmployeePayslips(currentUserId).subscribe({
      next: (payslips) => {
        // Sort by year and month (most recent first)
        const sorted = payslips.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });
        
        this.recentPayslips.set(sorted.slice(0, 6)); // Show only last 6
        this.isLoadingRecent.set(false);
      },
      error: (error) => {
        console.error('Error loading recent payslips:', error);
        this.isLoadingRecent.set(false);
      }
    });
  }

  // Utility methods
  getStatusClass(status: PayslipInfo['status']): string {
    const statusClasses = {
      'available': 'status-success',
      'processing': 'status-warning',
      'not_available': 'status-info',
      'not_generated': 'status-error'
    };
    return statusClasses[status] || 'status-default';
  }

  getStatusTitle(status: PayslipInfo['status']): string {
    const statusTitles = {
      'available': 'Ready for Download',
      'processing': 'Being Processed',
      'not_available': 'Not Available',
      'not_generated': 'Not Generated'
    };
    return statusTitles[status] || 'Unknown Status';
  }

  getStatusMessage(): string {
    if (!this.payslipStatus()) return '';
    
    const status = this.payslipStatus()!;
    return this.payslipService.getStatusMessage(status.status, status.month, status.year);
  }

  getMonthName(month: number): string {
    return this.payslipService.getMonthName(month);
  }

  isFutureMonth(): boolean {
    if (!this.selectedMonth() || !this.selectedYear()) return false;
    
    return this.payslipService.isFutureMonth(this.selectedMonth()!, this.selectedYear()!);
  }
}
