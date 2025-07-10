import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface PayslipInfo {
  id: string;
  employeeId: string;
  month: number; // 1-12
  year: number;
  status: 'available' | 'processing' | 'not_available' | 'not_generated';
  grossSalary?: number;
  netSalary?: number;
  deductions?: number;
  generatedDate?: string;
  downloadUrl?: string;
  fileName?: string;
}

export interface PayslipRequest {
  employeeId: string;
  month: number;
  year: number;
}

export interface PayslipDownloadResponse {
  success: boolean;
  url?: string;
  fileName?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PayslipService {
  private readonly API_BASE = environment.apiUrl; // Use environment configuration

  constructor(private http: HttpClient) {}

  /**
   * Get available payslips for an employee
   */
  getEmployeePayslips(employeeId: string, year?: number): Observable<PayslipInfo[]> {
    const url = `${this.API_BASE}/payslips/employee/${employeeId}`;
    
    if (year) {
      return this.http.get<PayslipInfo[]>(url, { params: { year: year.toString() } })
        .pipe(catchError(this.handleError));
    } else {
      return this.http.get<PayslipInfo[]>(url)
        .pipe(catchError(this.handleError));
    }
  }

  /**
   * Get payslip status for a specific month/year
   */
  getPayslipStatus(request: PayslipRequest): Observable<PayslipInfo> {
    return this.http.post<PayslipInfo>(`${this.API_BASE}/payslips/status`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Download payslip for a specific month/year
   */
  downloadPayslip(request: PayslipRequest): Observable<PayslipDownloadResponse> {
    return this.http.post<PayslipDownloadResponse>(`${this.API_BASE}/payslips/download`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Request payslip generation for future months (if allowed)
   */
  requestPayslipGeneration(request: PayslipRequest): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.API_BASE}/payslips/request`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Download payslip file directly
   */
  downloadPayslipFile(payslipId: string): Observable<Blob> {
    return this.http.get(`${this.API_BASE}/payslips/${payslipId}/download`, {
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get months with available payslips for an employee
   */
  getAvailableMonths(employeeId: string, year: number): Observable<number[]> {
    return this.http.get<number[]>(`${this.API_BASE}/payslips/employee/${employeeId}/available-months/${year}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Utility method to get month names
   */
  getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || '';
  }

  /**
   * Get the last N years for dropdown
   */
  getAvailableYears(yearsBack: number = 3): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    
    for (let i = 0; i <= yearsBack; i++) {
      years.push(currentYear - i);
    }
    
    return years;
  }

  /**
   * Check if a specific month/year is in the future
   */
  isFutureMonth(month: number, year: number): boolean {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // getMonth() returns 0-11
    
    return year > currentYear || (year === currentYear && month > currentMonth);
  }

  /**
   * Get status message based on payslip status
   */
  getStatusMessage(status: PayslipInfo['status'], month: number, year: number): string {
    const monthName = this.getMonthName(month);
    
    switch (status) {
      case 'available':
        return `Payslip for ${monthName} ${year} is ready for download`;
      case 'processing':
        return `Payslip for ${monthName} ${year} is being processed. Please check back later`;
      case 'not_available':
        return `Payslip for ${monthName} ${year} is not yet available`;
      case 'not_generated':
        return `Payslip for ${monthName} ${year} has not been generated yet`;
      default:
        return `Payslip status unknown`;
    }
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 404:
          errorMessage = 'Payslip not found';
          break;
        case 403:
          errorMessage = 'You do not have permission to access this payslip';
          break;
        case 400:
          errorMessage = 'Invalid request. Please check your selection';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later';
          break;
        default:
          errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }
    
    console.error('PayslipService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
