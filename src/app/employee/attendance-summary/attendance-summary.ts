import { Component, OnInit, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService } from '../../core/services/attendance.service';
import { AttendanceRecord, AttendanceStats } from '../../core/interfaces/common.interfaces';

@Component({
  selector: 'app-attendance-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="attendance-summary">
      <h2 class="summary-title">Attendance Summary</h2>
      
      <!-- Statistics Cards -->
      <div class="stats-grid" *ngIf="stats() as statsData">
        <div class="stat-card">
          <div class="stat-number">{{ statsData.presentDays }}</div>
          <div class="stat-label">Present Days</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ statsData.totalWorkingHours.toFixed(1) }}</div>
          <div class="stat-label">Total Hours</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ statsData.partialDays }}</div>
          <div class="stat-label">Partial Days</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ statsData.absentDays }}</div>
          <div class="stat-label">Absent Days</div>
        </div>
      </div>

      <!-- Recent Attendance Records -->
      <div class="recent-attendance">
        <h3 class="section-title">Recent Attendance (Last 10 days)</h3>
        <div class="attendance-table" *ngIf="recentRecords().length > 0; else noRecords">
          <div class="table-header">
            <div class="col-date">Date</div>
            <div class="col-login">Login</div>
            <div class="col-logout">Logout</div>
            <div class="col-hours">Hours</div>
            <div class="col-status">Status</div>
          </div>
          <div class="table-row" *ngFor="let record of recentRecords()">
            <div class="col-date">{{ formatDate(record.date) }}</div>
            <div class="col-login">{{ record.loginTime || '--' }}</div>
            <div class="col-logout">{{ record.logoutTime || '--' }}</div>
            <div class="col-hours">{{ record.workingHours ? record.workingHours.toFixed(1) + 'h' : '--' }}</div>
            <div class="col-status">
              <span class="status-badge" [class]="'status-' + record.status">
                {{ record.status | titlecase }}
              </span>
            </div>
          </div>
        </div>
        <ng-template #noRecords>
          <p class="no-records">No attendance records found</p>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .attendance-summary {
      background: var(--card-surface);
      border-radius: 12px;
      padding: 24px;
      box-shadow: var(--shadow-md);
      margin: 20px 0;
      color: var(--text-color);
    }

    .summary-title {
      font-size: 24px;
      font-weight: 600;
      color: var(--text-color);
      margin-bottom: 20px;
      text-align: center;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      box-shadow: var(--shadow-sm);
      transition: transform var(--transition-fast);
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-number {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 14px;
      opacity: 0.9;
      font-weight: 500;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-color);
      margin-bottom: 16px;
    }

    .attendance-table {
      background: var(--background-secondary);
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--border-color);
    }

    .table-header, .table-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
      padding: 12px 16px;
      align-items: center;
    }

    .table-header {
      background: var(--card-hover);
      font-weight: 600;
      color: var(--text-secondary);
      font-size: 14px;
      border-bottom: 1px solid var(--border-color);
    }

    .table-row {
      border-bottom: 1px solid var(--border-light);
      font-size: 14px;
      color: var(--text-color);
    }

    .table-row:hover {
      background: var(--card-hover);
    }

    .table-row:last-child {
      border-bottom: none;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-present {
      background: var(--success-light);
      color: var(--success-color);
    }

    .status-partial {
      background: var(--warning-light);
      color: var(--warning-color);
    }

    .status-absent {
      background: var(--error-light);
      color: var(--error-color);
    }

    .no-records {
      text-align: center;
      color: var(--muted-text-color);
      font-style: italic;
      padding: 20px;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .table-header, .table-row {
        grid-template-columns: 1fr 1fr 1fr;
        font-size: 12px;
      }
      
      .col-hours, .col-logout {
        display: none;
      }
    }
  `],
  encapsulation: ViewEncapsulation.None
})
export class AttendanceSummary implements OnInit {
  private readonly attendanceService = inject(AttendanceService);
  
  // Get current employee ID from localStorage (set during login)
  private getCurrentEmployeeId(): string {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id || '64e7'; // fallback for existing users
    }
    return '64e7'; // fallback for development
  }

  private readonly currentEmployeeId = this.getCurrentEmployeeId();
  
  readonly stats = signal<AttendanceStats>({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    partialDays: 0,
    totalWorkingHours: 0
  });
  
  readonly recentRecords = signal<AttendanceRecord[]>([]);

  ngOnInit(): void {
    this.loadAttendanceStats();
    this.loadRecentRecords();
  }

  private loadAttendanceStats(): void {
    // Get stats for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    this.attendanceService.getAttendanceStats(this.currentEmployeeId, startOfMonth, endOfMonth)
      .subscribe({
        next: (stats) => this.stats.set(stats),
        error: (error) => console.error('Failed to load attendance stats:', error)
      });
  }

  private loadRecentRecords(): void {
    this.attendanceService.getRecentAttendance(this.currentEmployeeId)
      .subscribe({
        next: (records) => {
          // Sort by date descending and take last 10
          const sortedRecords = records
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);
          this.recentRecords.set(sortedRecords);
        },
        error: (error) => console.error('Failed to load recent records:', error)
      });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  }
}
