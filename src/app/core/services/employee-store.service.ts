import { Injectable, computed, signal } from '@angular/core';
import { Employee } from '../interfaces/common.interfaces';
import { EmployeeDataService } from './checkin-Employee/get-employee.service';
import { catchError, map, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EmployeeStoreService {
  constructor(private api: EmployeeDataService) {}

  private _employees = signal<Employee[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  /** Public readonly signal to access employees */
  readonly employees = computed(() => this._employees());

  /** Employees without admins */
  readonly nonAdminEmployees = computed(() =>
    this._employees().filter(emp => emp.role?.toLowerCase() !== 'admin')
  );

  /** 🔄 Load and cache all employees */
  loadEmployees(forceReload = false): void {
    if (!forceReload && this._employees().length > 0) return;

    this.isLoading.set(true);
    this.error.set(null);

    this.api.getAllEmployee()
      .pipe(
        map(res => Array.isArray(res.data) ? res.data : []),
        map(list => list.filter(emp => !!emp._id)), // Optional: ignore invalid entries
        tap(list => {
          this._employees.set(list);
          this.isLoading.set(false);
        }),
        catchError(err => {
          this.error.set('Failed to load employees');
          this.isLoading.set(false);
          console.error('❌ Employee load error:', err);
          return of([]);
        })
      )
      .subscribe();
  }

  /** 🔄 Delete an employee from backend and local state */
  deleteEmployee(employeeId: string) {
    this.isLoading.set(true);

    return this.api.deleteEmployee(employeeId).pipe(
      tap(() => {
        this._employees.update(current =>
          current.filter(emp => emp._id !== employeeId)
        );
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.error.set('Failed to delete employee');
        this.isLoading.set(false);
        console.error('❌ Delete error:', err);
        return of(null);
      })
    );
  }

  /** Get employee from signal (locally) */
  getEmployeeById(id: string): Employee | undefined {
    return this._employees().find(emp => emp._id === id);
  }

  /** Clear state — used during logout or cleanup */
  clear(): void {
    this._employees.set([]);
    this.isLoading.set(false);
    this.error.set(null);
  }
}
