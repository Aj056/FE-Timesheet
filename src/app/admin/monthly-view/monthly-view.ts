
import {
  Component, signal, computed, effect, inject, OnInit, ViewEncapsulation
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormatTimePipe } from '../../core/pipes/timeFormat.pipe';
import { ToastService } from '../../core/services/toast.service';
import { EmployeeStoreService } from '../../core/services/employee-store.service';

@Component({
  selector: 'app-monthly-view',
  standalone: true,
  imports: [FormsModule, CommonModule, FormatTimePipe],
  templateUrl: './monthly-view.html',
  styleUrl: './monthly-view.scss',
  encapsulation: ViewEncapsulation.None
})
export class MonthlyView implements OnInit {
  private readonly store = inject(EmployeeStoreService);
  toastService = inject(ToastService)
  selectedMonth = signal(new Date().getMonth() + 1);
  selectedYear = signal(new Date().getFullYear());

  isLoading = this.store.isLoading;
  error = this.store.error;

  years = [2024, 2025, 2026];
  months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  attendanceRecords = this.store.employees;

  ngOnInit(): void {
    this.store.employees();
  }
  refreshData(){
    this.store.loadEmployees(true);
    this.toastService.info({ title: 'Refreshing', message: 'Reloading employee data...', duration: 2000 });
  }
}
