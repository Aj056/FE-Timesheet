import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- app-pagination.component.html -->
<div class="pagination-controls">
  <button class="prev" (click)="prev.emit()" [disabled]="pagination.currentPage === 1">
    ◀ Prev
  </button>

  <span class="page-indicator">
    Page {{ pagination.currentPage }} of {{ totalPages }}
  </span>

  <button class="next" (click)="next.emit()" [disabled]="pagination.currentPage === totalPages">
    Next ▶
  </button>
</div>

  `,

})
export class PaginationComponent {
  @Input() pagination!: { currentPage: number; pageSize: number };
  @Input() totalPages!: number;
  @Output() next = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();
}
