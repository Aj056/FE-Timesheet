import {
  Component, signal, computed, ViewEncapsulation, inject, OnInit
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../shared/components/pagination/pagination';
import { ToastService } from '../../core/services/toast.service';
import { PopupService } from '../../core/services/popup.service';
import { Employee } from '../../core/interfaces/common.interfaces';
import { EmployeeStoreService } from '../../core/services/employee-store.service';
import { createPagination } from '../../shared/components/pagination/pagination.signal';

@Component({
  selector: 'app-employees-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PaginationComponent],
  templateUrl: './employees-list.html',
  styleUrl: './employees-list.scss',
  encapsulation: ViewEncapsulation.None
})
export class EmployeesList implements OnInit {
  private router = inject(Router);
  private toastService = inject(ToastService);
  private popupService = inject(PopupService);
  private employeeStore = inject(EmployeeStoreService);

  searchTerm = signal('');
  isLoading = this.employeeStore.isLoading;
  error = this.employeeStore.error;

  // Filter employees based on search term
  filteredEmployees = computed(() => {
    const all = this.employeeStore.nonAdminEmployees();
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return all;

    return all.filter(emp => {
      const fields = [
        emp.employeeName, emp.username, emp.employeeEmail,
        emp.designation, emp.department, emp.phone
      ].map(val => (val || '').toLowerCase());

      return fields.some(f => f.includes(term));
    });
  });

  // Pagination utilities
  paginationUtils = createPagination(this.filteredEmployees);
  paginatedEmployees = this.paginationUtils.paginated;
  pagination = this.paginationUtils.pagination;
  totalPages = this.paginationUtils.totalPages;
  nextPage = this.paginationUtils.nextPage;
  prevPage = this.paginationUtils.prevPage;

  ngOnInit() {
     this.employeeStore.loadEmployees(); 
  }

  // Search behavior
  onSearchChange(term: string) {
    this.searchTerm.set(term);
    this.pagination.set({ ...this.pagination(), currentPage: 1 });
  }

  clearSearch() {
    this.searchTerm.set('');
    this.pagination.set({ ...this.pagination(), currentPage: 1 });
  }

  // View / Edit Navigation
  viewDetails(id: string) {
    this.toastService.info({ title: 'Loading...', message: 'Opening details...', duration: 1500 });
    console.log('Navigating to details for ID:', id);
    this.router.navigate(['/admin/employee-details', id]);
  }

  editEmployee(id: string) {
    this.router.navigate(['/admin/edit-employee', id]);
  }

  refreshData() {
    this.employeeStore.loadEmployees(true);
    this.toastService.info({ title: 'Refreshing', message: 'Reloading employee data...', duration: 2000 });
  }

  // deleteEmployee(employee: Employee) {
  //   this.popupService.confirm({
  //     title: 'Delete Employee',
  //     message: `Are you sure you want to delete ${employee.name}?`,
  //     confirmText: 'Delete',
  //     cancelText: 'Cancel',
  //     confirmStyle: 'danger'
  //   }).then(result => {
  //     if (result.action === 'confirm') {
  //       this.performDelete(employee);
  //     }
  //   });
  // }

  // private performDelete(employee: Employee) {
  //   this.toastService.info({ title: 'Deleting', message: `Removing ${employee.name}`, duration: 2000 });

  //   this.employeeStore.deleteEmployee(employee.id!).subscribe({
  //     next: () => {
  //       this.toastService.success({
  //         title: 'Deleted',
  //         message: `${employee.name} removed.`,
  //         duration: 3000
  //       });
  //     },
  //     error: () => {
  //       this.toastService.error({
  //         title: 'Failed to Delete',
  //         message: `Couldn't delete ${employee.name}`,
  //         duration: 4000
  //       });
  //     }
  //   });
  // }

  // TrackBy
  trackEmployee(index: number, emp: Employee) {
    return emp._id;
  }

  // UI Helpers
  getShortAddress(address: string): string {
    return address.length > 30 ? address.slice(0, 30) + '...' : address;
  }

  getStatusClass(status: boolean) {
    return status ? 'status-active' : 'status-inactive';
  }

  getStatusText(status: boolean) {
    return status ? 'Active' : 'Inactive';
  }

  // getRoleClass(role: string) {
  //   return {
  //     admin: 'role-admin',
  //     manager: 'role-manager',
  //     employee: 'role-employee'
  //   }[role?.toLowerCase()] || 'role-default';
  // }

  // Count Helpers for Cards
  totalEmployeesCount() {
    return this.filteredEmployees().length;
  }

  activeEmployeesCount() {
    return this.filteredEmployees().filter(emp => emp.status === true).length;
  }

  inactiveEmployeesCount() {
    return this.filteredEmployees().filter(emp => emp.status === false).length;
  }

  getSearchResultsCount() {
    return this.filteredEmployees().length;
  }

  isSearchActive(): boolean {
    return this.searchTerm().trim().length > 0;
  }
}
