import { Component, signal, computed, effect, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AttendanceService } from '../../core/services/attendance.service';
import { AttendanceRecord } from '../../core/interfaces/common.interfaces';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface Employee {
  _id: string;
  employeeName: string;
  checkin: string;
  checkout: string | null;
  totalhours: string | null;
  status: boolean;
  __v: number;
}

interface AttendanceDisplay {
  id: string;
  employeeName: string;
  date: string;
  checkinTime: string | null;
  checkoutTime: string | null;
  totalHours: string | null;
  status: 'Present' | 'Incomplete' | 'Absent';
  formattedDate: string;
  rawCheckin: string;
  rawCheckout: string | null;
}

@Component({
  selector: 'app-monthly-view',
  imports: [FormsModule, CommonModule],
  templateUrl: './monthly-view.html',
  styleUrl: './monthly-view.scss',
  standalone: true,
  encapsulation: ViewEncapsulation.None
})
export class MonthlyView implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly attendanceService = inject(AttendanceService);
  private readonly baseUrl = environment.apiUrl; // Backend API URL

  selectedMonth = signal(new Date().getMonth() + 1);
  selectedYear = signal(new Date().getFullYear());
  isLoading = signal(false);
  error = signal<string | null>(null);

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

  employees = signal<Employee[]>([]);
  attendanceRecords = signal<Employee[]>([]);

  filteredLogs = computed(() => {
    const year = this.selectedYear();
    const month = this.selectedMonth();
    
    return this.attendanceRecords()
      .map(record => this.transformRecord(record))
      .filter((record): record is AttendanceDisplay => record !== null) // Filter out null values
      .filter(record => this.isRecordInMonth(record, year, month))
      .sort((a, b) => {
        // Sort by date (newest first) then by employee name
        const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateCompare === 0) {
          return a.employeeName.localeCompare(b.employeeName);
        }
        return dateCompare;
      });
  });

  // Summary statistics for the selected month
 

  constructor() {
    // Watch for month/year changes and reload data
    effect(() => {
      const month = this.selectedMonth();
      const year = this.selectedYear();
      this.loadAttendanceData();
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadAttendanceData();
  }

  private loadEmployees(): void {
    // This method might not be needed since we get employee data from attendance
    // Keep for future employee list functionality if needed
  }

  private loadAttendanceData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Get attendance records from your API endpoint
    this.http.get<{data: Employee[]}>(`${this.baseUrl}/allcheckin`)
      .pipe(
        catchError(error => {
          console.error('Failed to load attendance data:', error);
          this.error.set('Failed to load attendance data');
          return of({data: []});
        })
      )
      .subscribe(response => {
        this.attendanceRecords.set(response.data || []);
        this.isLoading.set(false);
        console.log('Loaded attendance data:', response.data);
      });
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  }

  private transformRecord(record: Employee): AttendanceDisplay | null {
    const checkinDate = this.parseDate(record.checkin);
    const checkoutDate = record.checkout ? this.parseDate(record.checkout) : null;
    
    // Validate parsed dates
    if (!checkinDate || isNaN(checkinDate.getTime())) {
      console.error('❌ Invalid checkin date:', record.checkin);
      return null; // Skip invalid records
    }
    
    return {
      id: record._id,
      employeeName: record.employeeName,
      date: checkinDate.toISOString().split('T')[0], // YYYY-MM-DD format
      checkinTime: this.formatTime(record.checkin),
      checkoutTime: record.checkout ? this.formatTime(record.checkout) : null,
      totalHours: record.totalhours || null,
      status: this.determineStatus(record),
      formattedDate: this.formatDate(checkinDate.toISOString()),
      rawCheckin: record.checkin,
      rawCheckout: record.checkout
    };
  }

  private parseDate(dateInput: string): Date | null {
    try {
      // Handle different date formats from your API
      if (dateInput.includes('T')) {
        // ISO format: "2025-07-21T15:03:35.921666" or "2025-07-07T13:01:35.133Z"
        return new Date(dateInput);
      } else if (dateInput.includes('/') && (dateInput.includes('am') || dateInput.includes('pm'))) {
        // Format like: "07.07.2025/3:30:pm"
        const [datePart, timePart] = dateInput.split('/');
        const [day, month, year] = datePart.split('.').map(Number);
        const [time, period] = timePart.split(/(?=[ap]m)/i);
        const [hours, minutes] = time.split(':').map(Number);
        
        let hour24 = hours;
        if (period.toLowerCase() === 'pm' && hours !== 12) hour24 += 12;
        if (period.toLowerCase() === 'am' && hours === 12) hour24 = 0;
        
        return new Date(year, month - 1, day, hour24, minutes, 0);
      } else if (dateInput.includes('.')) {
        // Date format: "21.07.2025"
        const [day, month, year] = dateInput.split('.').map(Number);
        return new Date(year, month - 1, day);
      } else if (dateInput.includes(':') && (dateInput.includes('AM') || dateInput.includes('PM'))) {
        // Time format: "06:25:46 PM"
        const today = new Date();
        const timeStr = dateInput;
        const [time, period] = timeStr.split(' ');
        const [hours, minutes, seconds] = time.split(':').map(Number);
        
        let hour24 = hours;
        if (period === 'PM' && hours !== 12) hour24 += 12;
        if (period === 'AM' && hours === 12) hour24 = 0;
        
        today.setHours(hour24, minutes, seconds || 0, 0);
        return today;
      } else {
        // Fallback
        const fallbackDate = new Date(dateInput);
        return isNaN(fallbackDate.getTime()) ? null : fallbackDate;
      }
    } catch (error) {
      console.error('Error parsing date:', dateInput, error);
      return null;
    }
  }

  private formatTime(timeInput: string): string {
    try {
      const date = this.parseDate(timeInput);
      if (!date) {
        return timeInput; // Return original if parsing fails
      }
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return timeInput; // Return original if parsing fails
    }
  }

  private determineStatus(record: Employee): 'Present' | 'Incomplete' | 'Absent' {
    if (record.checkout && record.totalhours) {
      return 'Present';
    } else if (record.checkin && !record.checkout) {
      return 'Incomplete';
    } else {
      return 'Absent';
    }
  }

  private isRecordInMonth(record: AttendanceDisplay, year: number, month: number): boolean {
    const recordDate = new Date(record.date);
    return recordDate.getFullYear() === year && (recordDate.getMonth() + 1) === month;
  }

  private parseHoursFromString(hoursString: string): number {
    // Parse hours from format like "9:00" or "8:30"
    if (!hoursString) return 0;
    
    const parts = hoursString.split(':');
    if (parts.length >= 2) {
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      return hours + (minutes / 60);
    }
    
    // Try to parse as a simple number
    return parseFloat(hoursString) || 0;
  }

  // Export data to CSV
  exportData(): void {
    const data = this.filteredLogs();
    if (data.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Create CSV content
    const headers = ['Employee Name', 'Date', 'Check In', 'Check Out', 'Total Hours', 'Status'];
    const csvContent = [
      headers.join(','),
      ...data.map(record => [
        `"${record.employeeName}"`,
        record.date,
        `"${record.checkinTime || '-'}"`,
        `"${record.checkoutTime || '-'}"`,
        `"${record.totalHours || '-'}"`,
        record.status
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${this.getSelectedMonthName()}_${this.selectedYear()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Exported attendance data for', this.getSelectedMonthName(), this.selectedYear());
  }

  // Refresh data manually
  refreshData(): void {
    this.loadAttendanceData();
  }

  // Get status badge class
  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  // Track by function for performance
  trackByRecordId(index: number, record: AttendanceDisplay): string {
    return record.id;
  }

  // Get selected month name
  getSelectedMonthName(): string {
    const month = this.months.find(m => m.value === this.selectedMonth());
    return month ? month.label : '';
  }
}
