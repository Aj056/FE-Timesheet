import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" [class.has-toasts]="toasts().length > 0">
      <div 
        *ngFor="let toast of toasts(); trackBy: trackByToastId" 
        class="toast" 
        [ngClass]="getToastClasses(toast)"
        [attr.role]="toast.type === 'error' ? 'alert' : 'status'"
        [attr.aria-live]="toast.type === 'error' ? 'assertive' : 'polite'"
      >
        <!-- Toast Icon -->
        <div class="toast-icon">
          <svg 
            *ngIf="toast.type === 'success'" 
            class="icon-success" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          
          <svg 
            *ngIf="toast.type === 'error'" 
            class="icon-error" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
          
          <svg 
            *ngIf="toast.type === 'warning'" 
            class="icon-warning" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          
          <svg 
            *ngIf="toast.type === 'info'" 
            class="icon-info" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
          </svg>
        </div>

        <!-- Toast Content -->
        <div class="toast-content">
          <div class="toast-header">
            <h4 class="toast-title">{{ toast.title }}</h4>
            <span class="toast-time">{{ formatTime(toast.timestamp) }}</span>
          </div>
          <p class="toast-message">{{ toast.message }}</p>
          
          <!-- Toast Actions -->
          <div class="toast-actions" *ngIf="toast.actions && toast.actions.length > 0">
            <button 
              *ngFor="let action of toast.actions" 
              type="button"
              class="toast-action-btn"
              [ngClass]="'btn-' + (action.style || 'secondary')"
              (click)="handleAction(action, toast.id)"
            >
              {{ action.label }}
            </button>
          </div>
        </div>

        <!-- Close Button -->
        <button 
          type="button" 
          class="toast-close" 
          (click)="closeToast(toast.id)"
          [attr.aria-label]="'Close ' + toast.title + ' notification'"
        >
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </button>

        <!-- Progress Bar (for non-persistent toasts) -->
        <div 
          *ngIf="!toast.persistent && toast.duration" 
          class="toast-progress"
          [style.animation-duration]="toast.duration + 'ms'"
        ></div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      max-width: 400px;
      width: 100%;
      pointer-events: none;
      transition: all 0.3s ease;
    }

    .toast-container.has-toasts {
      pointer-events: auto;
    }

    .toast {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      padding: 1rem;
      background: var(--color-surface, #ffffff);
      border-left: 4px solid var(--toast-accent-color);
      border-radius: 0.5rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      transform: translateX(100%);
      animation: slideIn 0.3s ease forwards;
      overflow: hidden;
      backdrop-filter: blur(10px);
      pointer-events: auto;
    }

    .toast.removing {
      animation: slideOut 0.3s ease forwards;
    }

    /* Toast Type Colors */
    .toast.toast-success {
      --toast-accent-color: #10b981;
      --toast-icon-color: #10b981;
      --toast-bg-accent: rgba(16, 185, 129, 0.1);
    }

    .toast.toast-error {
      --toast-accent-color: #ef4444;
      --toast-icon-color: #ef4444;
      --toast-bg-accent: rgba(239, 68, 68, 0.1);
    }

    .toast.toast-warning {
      --toast-accent-color: #f59e0b;
      --toast-icon-color: #f59e0b;
      --toast-bg-accent: rgba(245, 158, 11, 0.1);
    }

    .toast.toast-info {
      --toast-accent-color: #3b82f6;
      --toast-icon-color: #3b82f6;
      --toast-bg-accent: rgba(59, 130, 246, 0.1);
    }

    /* Dark theme */
    [data-theme="dark"] .toast {
      background: var(--color-surface-elevated, #1f2937);
      color: var(--color-text-primary, #f9fafb);
    }

    /* Toast Icon */
    .toast-icon {
      flex-shrink: 0;
      width: 1.5rem;
      height: 1.5rem;
      margin-top: 0.125rem;
      color: var(--toast-icon-color);
    }

    .toast-icon svg {
      width: 100%;
      height: 100%;
    }

    /* Toast Content */
    .toast-content {
      flex: 1;
      min-width: 0;
    }

    .toast-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.25rem;
      gap: 0.5rem;
    }

    .toast-title {
      font-size: 0.875rem;
      font-weight: 600;
      margin: 0;
      color: var(--color-text-primary, #111827);
      line-height: 1.25;
    }

    .toast-time {
      font-size: 0.75rem;
      color: var(--color-text-secondary, #6b7280);
      white-space: nowrap;
      flex-shrink: 0;
      margin-right:2rem;
    }

    .toast-message {
      font-size: 0.875rem;
      color: var(--color-text-secondary, #374151);
      margin: 0;
      line-height: 1.4;
      word-wrap: break-word;
    }

    /* Toast Actions */
    .toast-actions {
      margin-top: 0.75rem;
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .toast-action-btn {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 500;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .toast-action-btn.btn-primary {
      background: var(--toast-accent-color);
      color: white;
    }

    .toast-action-btn.btn-primary:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .toast-action-btn.btn-secondary {
      background: var(--color-surface-elevated, #f3f4f6);
      color: var(--color-text-primary, #374151);
      border: 1px solid var(--color-border, #d1d5db);
    }

    .toast-action-btn.btn-secondary:hover {
      background: var(--color-surface-hover, #e5e7eb);
    }

    /* Close Button */
    .toast-close {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      width: 1.25rem;
      height: 1.25rem;
      background: none;
      border: none;
      color: var(--color-text-tertiary, #9ca3af);
      cursor: pointer;
      transition: color 0.2s ease;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toast-close:hover {
      color: var(--color-text-secondary, #6b7280);
    }

    .toast-close svg {
      width: 100%;
      height: 100%;
    }

    /* Progress Bar */
    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: var(--toast-accent-color);
      opacity: 0.7;
      animation: progressBar linear;
      transform-origin: left;
    }

    /* Animations */
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
        max-height: 200px;
        margin-bottom: 0.75rem;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
        max-height: 0;
        margin-bottom: 0;
        padding-top: 0;
        padding-bottom: 0;
      }
    }

    @keyframes progressBar {
      from {
        transform: scaleX(1);
      }
      to {
        transform: scaleX(0);
      }
    }

    /* Responsive */
    @media (max-width: 640px) {
      .toast-container {
        top: 0;
        right: 0;
        left: 0;
        max-width: none;
        padding: 1rem;
      }

      .toast {
        margin-bottom: 0.5rem;
      }

      .toast-actions {
        margin-top: 0.5rem;
      }

      .toast-action-btn {
        flex: 1;
        min-width: 0;
      }
    }

    /* High contrast mode */
    @media (prefers-contrast: high) {
      .toast {
        border-width: 2px;
        border-style: solid;
        border-color: var(--toast-accent-color);
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .toast {
        animation: none;
        transform: translateX(0);
      }
      
      .toast-progress {
        animation: none;
      }
    }
  `]
})
export class ToastContainerComponent implements OnInit {
  toasts = signal<Toast[]>([]);

  constructor(private toastService: ToastService) {
    // Subscribe to toast updates
    effect(() => {
      this.toasts.set(this.toastService.toasts$());
    });
  }

  ngOnInit(): void {
    // Component is reactive through signals
  }

  trackByToastId(index: number, toast: Toast): string {
    return toast.id;
  }

  getToastClasses(toast: Toast): string {
    return `toast-${toast.type} ${toast.persistent ? 'persistent' : ''}`;
  }

  closeToast(id: string): void {
    this.toastService.remove(id);
  }

  handleAction(action: any, toastId: string): void {
    action.action();
    // Optionally close toast after action
    this.toastService.remove(toastId);
  }

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
}
