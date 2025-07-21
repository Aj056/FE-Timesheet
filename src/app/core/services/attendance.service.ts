import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD format
  loginTime: string | null;
  logoutTime: string | null;
  workingHours?: number;
  status: 'present' | 'absent' | 'partial';
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  partialDays: number;
  totalWorkingHours: number;
}

export interface Employee {
  id: string;
  name?: string;
  employeeName?: string;
  email?: string;
  employeeEmail?: string;
  username: string;
  role: string;
  department?: string;
  joiningDate: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl; // Use environment configuration
  
  // Current attendance data as BehaviorSubject for real-time updates
  private attendanceSubject = new BehaviorSubject<AttendanceRecord[]>([]);
  public attendance$ = this.attendanceSubject.asObservable();

  // Current session management
  private currentSessionSubject = new BehaviorSubject<AttendanceRecord | null>(null);
  public currentSession$ = this.currentSessionSubject.asObservable();

  constructor() {
    this.loadAttendanceData();
    this.initializeCurrentSession();
  }

  // Initialize current session from localStorage
  private initializeCurrentSession(): void {
    const savedSession = localStorage.getItem('currentAttendanceSession');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        this.currentSessionSubject.next(session);
      } catch (error) {
        console.error('Error parsing saved session:', error);
        localStorage.removeItem('currentAttendanceSession');
      }
    }
  }

  // Load all attendance data
  private loadAttendanceData(): void {
    this.getAttendanceRecords().subscribe({
      next: (records) => this.attendanceSubject.next(records),
      error: (error) => console.error('Failed to load attendance data:', error)
    });
  }

  // Get all attendance records (from localStorage for now)
  getAttendanceRecords(): Observable<AttendanceRecord[]> {
    try {
      const records = localStorage.getItem('attendanceRecords');
      const attendanceData = records ? JSON.parse(records) : [];
      return of(attendanceData);
    } catch (error) {
      console.error('Failed to load attendance records:', error);
      return of([]);
    }
  }

  // Get attendance records for a specific employee
  getEmployeeAttendance(employeeId: string): Observable<AttendanceRecord[]> {
    return this.getAttendanceRecords().pipe(
      map(records => records.filter(record => record.employeeId === employeeId))
    );
  }

  // Get today's attendance for an employee
  getTodayAttendance(employeeId: string): Observable<AttendanceRecord | null> {
    const today = new Date().toISOString().split('T')[0];
    return this.getEmployeeAttendance(employeeId).pipe(
      map(records => records.find(record => record.date === today) || null)
    );
  }

  // Record login time
  recordLogin(employeeId: string, employeeName: string): Observable<AttendanceRecord> {
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toISOString();
    const loginTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    return this.getTodayAttendance(employeeId).pipe(
      switchMap((existingRecord: AttendanceRecord | null) => {
        if (existingRecord) {
          // Update existing record
          const updatedRecord: AttendanceRecord = {
            ...existingRecord,
            loginTime,
            status: existingRecord.logoutTime ? 'present' : 'partial',
            updatedAt: currentTime
          };
          return this.updateAttendanceRecord(updatedRecord);
        } else {
          // Create new record
          const newRecord: AttendanceRecord = {
            id: this.generateId(),
            employeeId,
            employeeName,
            date: today,
            loginTime,
            logoutTime: null,
            status: 'partial',
            createdAt: currentTime,
            updatedAt: currentTime
          };
          return this.createAttendanceRecord(newRecord);
        }
      }),
      catchError(error => {
        console.error('Failed to record login:', error);
        throw error;
      })
    );
  }

  // Record logout time
  recordLogout(employeeId: string): Observable<AttendanceRecord> {
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toISOString();
    const logoutTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    return this.getTodayAttendance(employeeId).pipe(
      switchMap((existingRecord: AttendanceRecord | null) => {
        if (existingRecord && existingRecord.loginTime) {
          const workingHours = this.calculateWorkingHours(existingRecord.loginTime, logoutTime);
          const updatedRecord: AttendanceRecord = {
            ...existingRecord,
            logoutTime,
            workingHours,
            status: 'present',
            updatedAt: currentTime
          };
          return this.updateAttendanceRecord(updatedRecord);
        } else {
          throw new Error('No login record found for today');
        }
      }),
      catchError(error => {
        console.error('Failed to record logout:', error);
        throw error;
      })
    );
  }

  // Create new attendance record (localStorage implementation)
  private createAttendanceRecord(record: AttendanceRecord): Observable<AttendanceRecord> {
    try {
      const existingRecords = this.getLocalStorageRecords();
      existingRecords.push(record);
      localStorage.setItem('attendanceRecords', JSON.stringify(existingRecords));
      this.loadAttendanceData(); // Refresh data
      return of(record);
    } catch (error) {
      console.error('Failed to create attendance record:', error);
      return throwError(() => error);
    }
  }

  // Update existing attendance record (localStorage implementation)
  private updateAttendanceRecord(record: AttendanceRecord): Observable<AttendanceRecord> {
    try {
      const existingRecords = this.getLocalStorageRecords();
      const index = existingRecords.findIndex(r => r.id === record.id);
      if (index !== -1) {
        existingRecords[index] = record;
        localStorage.setItem('attendanceRecords', JSON.stringify(existingRecords));
        this.loadAttendanceData(); // Refresh data
      }
      return of(record);
    } catch (error) {
      console.error('Failed to update attendance record:', error);
      return throwError(() => error);
    }
  }

  // Helper method to get records from localStorage
  private getLocalStorageRecords(): AttendanceRecord[] {
    try {
      const records = localStorage.getItem('attendanceRecords');
      return records ? JSON.parse(records) : [];
    } catch (error) {
      console.error('Failed to parse attendance records from localStorage:', error);
      return [];
    }
  }

  // Get attendance statistics for an employee (localStorage implementation)
  getAttendanceStats(employeeId: string, startDate?: string, endDate?: string): Observable<AttendanceStats> {
    return this.getEmployeeAttendance(employeeId).pipe(
      map(records => {
        // Filter by date range if provided
        let filteredRecords = records;
        if (startDate && endDate) {
          filteredRecords = records.filter(record => 
            record.date >= startDate && record.date <= endDate
          );
        }

        const stats: AttendanceStats = {
          totalDays: filteredRecords.length,
          presentDays: filteredRecords.filter(r => r.status === 'present').length,
          absentDays: filteredRecords.filter(r => r.status === 'absent').length,
          partialDays: filteredRecords.filter(r => r.status === 'partial').length,
          totalWorkingHours: filteredRecords.reduce((total, record) => 
            total + (record.workingHours || 0), 0
          )
        };

        return stats;
      }),
      catchError(() => of({
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        partialDays: 0,
        totalWorkingHours: 0
      }))
    );
  }

  // Check if employee is currently logged in
  isLoggedIn(): boolean {
    const session = this.currentSessionSubject.value;
    return session !== null && session.loginTime !== null && session.logoutTime === null;
  }

  // Get current employee from localStorage
  getCurrentEmployee(): Employee | null {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  }

  // Login employee
  loginEmployee(): Observable<AttendanceRecord> {
    const employee = this.getCurrentEmployee();
    if (!employee) {
      return throwError(() => new Error('No employee data found. Please login first.'));
    }

    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Check if already logged in today
    return this.getTodayAttendance(employee.id).pipe(
      switchMap(existingRecord => {
        if (existingRecord && existingRecord.loginTime && !existingRecord.logoutTime) {
          // Already logged in, update current session
          this.currentSessionSubject.next(existingRecord);
          localStorage.setItem('currentAttendanceSession', JSON.stringify(existingRecord));
          return of(existingRecord);
        }

        // Create new attendance record
        const attendanceRecord: AttendanceRecord = {
          id: this.generateId(),
          employeeId: employee.id,
          employeeName: employee.name || employee.employeeName || employee.username,
          date: today,
          loginTime: currentTime,
          logoutTime: null,
          workingHours: 0,
          status: 'partial',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Try backend first, fallback to localStorage
        return this.http.post<AttendanceRecord>(`${this.baseUrl}/attendance`, attendanceRecord).pipe(
          tap(record => {
            this.currentSessionSubject.next(record);
            localStorage.setItem('currentAttendanceSession', JSON.stringify(record));
            localStorage.setItem('lastLoginTime', record.loginTime || currentTime);
            this.loadAttendanceData();
          }),
          catchError((error: HttpErrorResponse) => {
            console.error('Backend login failed, using localStorage fallback:', error);
            
            // Fallback to localStorage when backend is unavailable
            return this.createAttendanceRecord(attendanceRecord).pipe(
              tap(record => {
                this.currentSessionSubject.next(record);
                localStorage.setItem('currentAttendanceSession', JSON.stringify(record));
                localStorage.setItem('lastLoginTime', record.loginTime || currentTime);
              })
            );
          })
        );
      })
    );
  }

  // Logout employee
  logoutEmployee(): Observable<AttendanceRecord> {
    const currentSession = this.currentSessionSubject.value;
    if (!currentSession) {
      return throwError(() => new Error('No active session found. Please login first.'));
    }

    if (!currentSession.loginTime) {
      return throwError(() => new Error('Invalid session data. Please login again.'));
    }

    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const workingHours = this.calculateWorkingHours(currentSession.loginTime, currentTime);

    const updatedRecord: AttendanceRecord = {
      ...currentSession,
      logoutTime: currentTime,
      workingHours: workingHours,
      status: 'present',
      updatedAt: new Date().toISOString()
    };

    // Try backend first, fallback to localStorage
    return this.http.patch<AttendanceRecord>(`${this.baseUrl}/attendance/${currentSession.id}`, {
      logoutTime: currentTime,
      workingHours: workingHours,
      status: 'present',
      updatedAt: new Date().toISOString()
    }).pipe(
      map(() => updatedRecord),
      tap(record => {
        this.currentSessionSubject.next(null);
        localStorage.removeItem('currentAttendanceSession');
        localStorage.setItem('lastLogoutTime', currentTime);
        localStorage.setItem('lastWorkingHours', workingHours.toString());
        this.loadAttendanceData();
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Backend logout failed, using localStorage fallback:', error);
        
        // Fallback to localStorage when backend is unavailable
        return this.updateAttendanceRecord(updatedRecord).pipe(
          tap(record => {
            this.currentSessionSubject.next(null);
            localStorage.removeItem('currentAttendanceSession');
            localStorage.setItem('lastLogoutTime', currentTime);
            localStorage.setItem('lastWorkingHours', workingHours.toString());
          })
        );
      })
    );
  }

  // Backend check-in method
  checkInWithBackend(): Observable<AttendanceRecord> {
    const employee = this.getCurrentEmployee();
    if (!employee) {
      return throwError(() => new Error('No employee data found. Please login first.'));
    }

    return this.http.post<any>(`${this.baseUrl}/attendance/checkin`, {}).pipe(
      map(response => {
        console.log('✅ Backend check-in response:', response);
        
        if (response.success && response.attendance) {
          const attendance = response.attendance;
          const record: AttendanceRecord = {
            id: attendance._id || attendance.id,
            employeeId: attendance.employeeId,
            employeeName: employee.name || employee.employeeName || employee.username,
            date: new Date(attendance.date).toISOString().split('T')[0],
            loginTime: new Date(attendance.checkIn).toLocaleTimeString('en-US', {
              hour12: true,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }),
            logoutTime: null,
            workingHours: 0,
            status: 'partial',
            createdAt: attendance.date,
            updatedAt: attendance.date
          };

          // Update current session
          this.currentSessionSubject.next(record);
          localStorage.setItem('currentAttendanceSession', JSON.stringify(record));
          localStorage.setItem('lastLoginTime', record.loginTime || '');
          
          return record;
        } else {
          throw new Error(response.message || 'Check-in failed');
        }
      }),
      catchError(error => {
        console.error('🚨 Backend check-in error:', error);
        // Fallback to localStorage implementation
        return this.loginEmployee();
      })
    );
  }

  // Backend check-out method
  checkOutWithBackend(): Observable<AttendanceRecord> {
    const currentSession = this.currentSessionSubject.value;
    
    if (!currentSession) {
      return throwError(() => new Error('No active session found. Please check-in first.'));
    }

    return this.http.post<any>(`${this.baseUrl}/attendance/checkout`, {}).pipe(
      map(response => {
        console.log('✅ Backend check-out response:', response);
        
        if (response.success && response.attendance) {
          const attendance = response.attendance;
          const record: AttendanceRecord = {
            id: attendance._id || attendance.id,
            employeeId: attendance.employeeId,
            employeeName: currentSession.employeeName,
            date: new Date(attendance.date).toISOString().split('T')[0],
            loginTime: new Date(attendance.checkIn).toLocaleTimeString('en-US', {
              hour12: true,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }),
            logoutTime: new Date(attendance.checkOut).toLocaleTimeString('en-US', {
              hour12: true,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }),
            workingHours: attendance.duration ? attendance.duration / 3600 : 0, // Convert seconds to hours
            status: 'present',
            createdAt: attendance.date,
            updatedAt: attendance.date
          };

          // Clear current session
          this.currentSessionSubject.next(null);
          localStorage.removeItem('currentAttendanceSession');
          localStorage.setItem('lastLogoutTime', record.logoutTime || '');
          localStorage.setItem('lastWorkingHours', (record.workingHours || 0).toString());
          
          return record;
        } else {
          throw new Error(response.message || 'Check-out failed');
        }
      }),
      catchError(error => {
        console.error('🚨 Backend check-out error:', error);
        // Fallback to localStorage implementation
        return this.logoutEmployee();
      })
    );
  }

  // Get attendance records from backend
  getAttendanceFromBackend(page = 1, limit = 10): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/attendance?page=${page}&limit=${limit}`).pipe(
      map(response => {
        console.log('📊 Backend attendance records:', response);
        return response;
      }),
      catchError(error => {
        console.error('🚨 Backend attendance fetch error:', error);
        // Fallback to localStorage
        return this.getAttendanceRecords();
      })
    );
  }

  // Get employee dashboard stats from backend
  getEmployeeDashboard(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dashboard/employee`).pipe(
      map(response => {
        console.log('📊 Employee dashboard data:', response);
        return response;
      }),
      catchError(error => {
        console.error('🚨 Dashboard fetch error:', error);
        return of({
          success: false,
          message: 'Failed to fetch dashboard data'
        });
      })
    );
  }

  // Calculate working hours between login and logout
  private calculateWorkingHours(loginTime: string, logoutTime: string): number {
    try {
      // Parse time strings (format: "HH:MM:SS AM/PM")
      const loginDate = this.parseTimeString(loginTime);
      const logoutDate = this.parseTimeString(logoutTime);
      
      if (!loginDate || !logoutDate) {
        console.warn('Invalid time format for calculation:', { loginTime, logoutTime });
        return 0;
      }
      
      const diffMs = logoutDate.getTime() - loginDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      return Math.max(0, Math.round(diffHours * 100) / 100); // Round to 2 decimal places, minimum 0
    } catch (error) {
      console.error('Error calculating working hours:', error);
      return 0;
    }
  }

  // Helper method to parse time strings in various formats
  private parseTimeString(timeStr: string): Date | null {
    try {
      // Try to parse as "HH:MM:SS AM/PM" format
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        const baseDate = new Date();
        baseDate.setHours(0, 0, 0, 0);
        
        const [time, period] = timeStr.split(' ');
        const [hours, minutes, seconds] = time.split(':').map(Number);
        
        let hour24 = hours;
        if (period === 'PM' && hours !== 12) {
          hour24 += 12;
        } else if (period === 'AM' && hours === 12) {
          hour24 = 0;
        }
        
        baseDate.setHours(hour24, minutes || 0, seconds || 0);
        return baseDate;
      }
      
      // Try standard Date parsing
      const parsed = new Date(`2000-01-01 ${timeStr}`);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch (error) {
      console.error('Error parsing time string:', timeStr, error);
      return null;
    }
  }

  // Generate unique ID
  private generateId(): string {
    return 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Get current session
  getCurrentSession(): AttendanceRecord | null {
    return this.currentSessionSubject.value;
  }

  // Check for active session on app start
  checkForActiveSession(): void {
    const employee = this.getCurrentEmployee();
    if (!employee) return;

    const today = new Date().toISOString().split('T')[0];
    
    this.getTodayAttendance(employee.id).subscribe({
      next: (record) => {
        if (record && record.loginTime && !record.logoutTime) {
          this.currentSessionSubject.next(record);
          localStorage.setItem('currentAttendanceSession', JSON.stringify(record));
        }
      },
      error: (error) => {
        console.error('Error checking for active session:', error);
      }
    });
  }

  // Get recent attendance records (last 30 days)
  getRecentAttendance(employeeId: string): Observable<AttendanceRecord[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];

    // COMMENTED OUT: API call causing 404 errors
    // return this.http.get<AttendanceRecord[]>(`${this.baseUrl}/attendance?employeeId=${employeeId}`)
    //   .pipe(
    //     map(records => records.filter(record => record.date >= startDate)),
    //     catchError((error: HttpErrorResponse) => {
    //       console.warn('⚠️ Backend attendance fetch failed, using localStorage fallback:', error);
    //       // Fallback to localStorage data
    //       return this.getEmployeeAttendance(employeeId).pipe(
    //         map(records => records.filter(record => record.date >= startDate))
    //       );
    //     })
    //   );

    // Use localStorage fallback directly
    console.log('📋 Using localStorage attendance data (API call disabled)');
    return this.getEmployeeAttendance(employeeId).pipe(
      map(records => records.filter(record => record.date >= startDate))
    );
  }
}
