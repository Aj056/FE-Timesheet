import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PopupService, PopupConfig, PopupButton, FormField } from '../../../core/services/popup.service';

@Component({
  selector: 'app-popup-container',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="popup-overlay" *ngIf="popups().length > 0" [class.visible]="popups().length > 0">
      <div 
        *ngFor="let popup of popups(); trackBy: trackByPopupId; let isLast = last" 
        class="popup-backdrop"
        [class.active]="isLast"
        (click)="onBackdropClick(popup, $event)"
      >
        <div 
          class="popup-container"
          [ngClass]="getPopupClasses(popup)"
          [style.width]="popup.width"
          [style.height]="popup.height"
          (click)="$event.stopPropagation()"
          role="dialog"
          [attr.aria-labelledby]="'popup-title-' + popup.id"
          [attr.aria-describedby]="'popup-content-' + popup.id"
        >
          <!-- Loading Spinner for loading popups -->
          <div *ngIf="popup.type === 'loading'" class="popup-loading">
            <div class="loading-spinner">
              <div class="spinner"></div>
            </div>
            <div class="loading-content">
              <h3 class="popup-title" [id]="'popup-title-' + popup.id">{{ popup.title }}</h3>
              <p class="popup-message" *ngIf="popup.message" [id]="'popup-content-' + popup.id">{{ popup.message }}</p>
            </div>
          </div>

          <!-- Regular Popup Content -->
          <div *ngIf="popup.type !== 'loading'" class="popup-content">
            <!-- Close Button -->
            <button 
              *ngIf="popup.closable"
              type="button" 
              class="popup-close" 
              (click)="closePopup(popup.id)"
              aria-label="Close popup"
            >
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>

            <!-- Popup Header -->
            <div class="popup-header">
              <div class="popup-icon" 
                   [ngClass]="getPopupIconClasses(popup)"
                   *ngIf="shouldShowIcon(popup)">
                <ng-container [ngSwitch]="getPopupIcon(popup)">
                  <!-- Question Icon -->
                  <svg *ngSwitchCase="'question'" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                  </svg>
                  
                  <!-- Check Circle Icon -->
                  <svg *ngSwitchCase="'check-circle'" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  
                  <!-- Exclamation Triangle Icon -->
                  <svg *ngSwitchCase="'exclamation-triangle'" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                  </svg>
                  
                  <!-- Times Circle Icon -->
                  <svg *ngSwitchCase="'times-circle'" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
                  </svg>
                  
                  <!-- Info Icon -->
                  <svg *ngSwitchCase="'info'" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                  </svg>
                  
                  <!-- Default/Fallback Icon -->
                  <svg *ngSwitchDefault width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                  </svg>
                </ng-container>
              </div>
              <h3 class="popup-title" [id]="'popup-title-' + popup.id">{{ popup.title }}</h3>
            </div>

            <!-- Popup Body -->
            <div class="popup-body" [id]="'popup-content-' + popup.id">
              <!-- Text Message -->
              <p *ngIf="popup.message" class="popup-message">{{ popup.message }}</p>
              
              <!-- Custom HTML -->
              <div *ngIf="popup.html" class="popup-html" [innerHTML]="popup.html"></div>
              
              <!-- Form Content -->
              <form *ngIf="popup.type === 'form' && popup.data?.fields" class="popup-form" #popupForm="ngForm">
                <div *ngFor="let field of popup.data.fields" class="form-field">
                  <label [for]="field.name" class="field-label">
                    {{ field.label }}
                    <span *ngIf="field.required" class="required">*</span>
                  </label>
                  
                  <!-- Text Input -->
                  <input 
                    *ngIf="field.type === 'text' || field.type === 'email' || field.type === 'password' || field.type === 'number'"
                    [type]="field.type"
                    [id]="field.name"
                    [name]="field.name"
                    [(ngModel)]="popup.data.values[field.name]"
                    [placeholder]="field.placeholder"
                    [required]="field.required"
                    class="field-input"
                  />
                  
                  <!-- Textarea -->
                  <textarea 
                    *ngIf="field.type === 'textarea'"
                    [id]="field.name"
                    [name]="field.name"
                    [(ngModel)]="popup.data.values[field.name]"
                    [placeholder]="field.placeholder"
                    [required]="field.required"
                    class="field-textarea"
                    rows="3"
                  ></textarea>
                  
                  <!-- Select -->
                  <select 
                    *ngIf="field.type === 'select'"
                    [id]="field.name"
                    [name]="field.name"
                    [(ngModel)]="popup.data.values[field.name]"
                    [required]="field.required"
                    class="field-select"
                  >
                    <option value="">Choose...</option>
                    <option *ngFor="let option of field.options" [value]="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                  
                  <!-- Checkbox -->
                  <label *ngIf="field.type === 'checkbox'" class="field-checkbox">
                    <input 
                      type="checkbox"
                      [name]="field.name"
                      [(ngModel)]="popup.data.values[field.name]"
                      [required]="field.required"
                    />
                    <span class="checkmark"></span>
                  </label>
                </div>
              </form>
            </div>

            <!-- Popup Footer -->
            <div class="popup-footer" *ngIf="popup.buttons && popup.buttons.length > 0">
              <button 
                *ngFor="let button of popup.buttons" 
                type="button"
                class="popup-button"
                [ngClass]="'btn-' + (button.style || 'secondary')"
                [disabled]="button.disabled || button.loading"
                (click)="handleButtonClick(button, popup)"
              >
                <span *ngIf="button.loading" class="button-spinner"></span>
                {{ button.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .popup-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }

    .popup-overlay.visible {
      opacity: 1;
      visibility: visible;
    }

    .popup-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: none;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .popup-backdrop.active {
      opacity: 1;
    }

    .popup-container {
      position: relative;
      background: var(--color-surface, #ffffff);
      border-radius: 0.5rem;
      box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.25);
      max-width: 90vw;
      max-height: 90vh;
      overflow: hidden;
      transform: scale(0.9) translateY(-10px);
      transition: all 0.3s ease;
      border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
    }

    .popup-backdrop.active .popup-container {
      transform: scale(1) translateY(0);
    }

    /* Dark theme */
    [data-theme="dark"] .popup-container {
      background: var(--color-surface-elevated, #1f2937);
      color: var(--color-text-primary, #f9fafb);
      border-color: var(--color-border-dark, rgba(255, 255, 255, 0.1));
    }

    /* Loading Popup */
    .popup-loading {
      padding: 1.5rem;
      text-align: center;
      min-width: 280px;
    }

    .loading-spinner {
      margin-bottom: 1rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--color-border, #e5e7eb);
      border-top-color: var(--color-primary, #3b82f6);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }

    /* Regular Popup Content */
    .popup-content {
      position: relative;
      min-width: 280px;
      max-width: 500px;
    }

    .popup-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 2rem;
      height: 2rem;
      background: none;
      border: none;
      color: var(--color-text-tertiary, #9ca3af);
      cursor: pointer;
      border-radius: 0.375rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      z-index: 1;
    }

    .popup-close:hover {
      color: var(--color-text-secondary, #6b7280);
      background: var(--color-surface-hover, #f3f4f6);
    }

    .popup-close svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    /* Header */
    .popup-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1rem 0.5rem;
    }

    .popup-icon {
      flex-shrink: 0;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      background: var(--color-info-bg, #dbeafe);
      color: var(--color-info, #3b82f6);
    }

    .popup-icon.icon-question { background: var(--color-info-bg, #dbeafe); color: var(--color-info, #3b82f6); }
    .popup-icon.icon-check-circle { background: var(--color-success-bg, #d1fae5); color: var(--color-success, #10b981); }
    .popup-icon.icon-exclamation-triangle { background: var(--color-warning-bg, #fef3c7); color: var(--color-warning, #f59e0b); }
    .popup-icon.icon-times-circle { background: var(--color-error-bg, #fee2e2); color: var(--color-error, #ef4444); }
    .popup-icon.icon-info { background: var(--color-info-bg, #dbeafe); color: var(--color-info, #3b82f6); }

    .popup-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0;
      color: var(--color-text-primary, #111827);
      line-height: 1.2;
    }

    /* Body */
    .popup-body {
      padding: 0 1rem 1rem;
    }

    .popup-message {
      font-size: 0.875rem;
      color: var(--color-text-secondary, #6b7280);
      margin: 0;
      line-height: 1.4;
      white-space: pre-line;
    }

    .popup-html {
      font-size: 0.875rem;
      color: var(--color-text-secondary, #6b7280);
      line-height: 1.5;
    }

    /* Form */
    .popup-form {
      margin-top: 1rem;
    }

    .form-field {
      margin-bottom: 1rem;
    }

    .field-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-text-primary, #374151);
      margin-bottom: 0.5rem;
    }

    .required {
      color: var(--color-error, #ef4444);
    }

    .field-input,
    .field-textarea,
    .field-select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--color-border, #d1d5db);
      border-radius: 0.375rem;
      font-size: 0.875rem;
      transition: border-color 0.2s ease;
    }

    .field-input:focus,
    .field-textarea:focus,
    .field-select:focus {
      outline: none;
      border-color: var(--color-primary, #3b82f6);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .field-checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .checkmark {
      position: relative;
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid var(--color-border, #d1d5db);
      border-radius: 0.25rem;
      transition: all 0.2s ease;
    }

    input[type="checkbox"]:checked + .checkmark {
      background: var(--color-primary, #3b82f6);
      border-color: var(--color-primary, #3b82f6);
    }

    input[type="checkbox"]:checked + .checkmark::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 6px;
      width: 6px;
      height: 10px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    /* Footer */
    .popup-footer {
      padding: 0.75rem 1rem 1rem;
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      border-top: 1px solid var(--color-border, #e5e7eb);
    }

    .popup-button {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      position: relative;
    }

    .popup-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--color-primary, #3b82f6);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--color-primary-dark, #2563eb);
    }

    .btn-secondary {
      background: var(--color-surface-elevated, #f3f4f6);
      color: var(--color-text-primary, #374151);
      border: 1px solid var(--color-border, #d1d5db);
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--color-surface-hover, #e5e7eb);
    }

    .btn-danger {
      background: var(--color-error, #ef4444);
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: var(--color-error-dark, #dc2626);
    }

    .btn-success {
      background: var(--color-success, #10b981);
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background: var(--color-success-dark, #059669);
    }

    .btn-warning {
      background: var(--color-warning, #f59e0b);
      color: white;
    }

    .btn-warning:hover:not(:disabled) {
      background: var(--color-warning-dark, #d97706);
    }

    .button-spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid transparent;
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    /* Popup Types */
    .popup-confirm .popup-icon { color: var(--color-warning, #f59e0b); }
    .popup-alert .popup-icon { color: var(--color-info, #3b82f6); }
    .popup-custom .popup-icon { color: var(--color-primary, #3b82f6); }

    /* Animations */
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Responsive */
    @media (max-width: 640px) {
      .popup-container {
        margin: 1rem;
        max-width: calc(100vw - 2rem);
      }

      .popup-header {
        padding: 1rem 1rem 0.75rem;
      }

      .popup-body {
        padding: 0 1rem 1rem;
      }

      .popup-footer {
        padding: 0.75rem 1rem 1rem;
        flex-direction: column;
      }

      .popup-button {
        width: 100%;
        justify-content: center;
      }
    }

    /* Accessibility */
    @media (prefers-reduced-motion: reduce) {
      .popup-overlay,
      .popup-backdrop,
      .popup-container,
      .popup-button,
      .spinner {
        transition: none;
        animation: none;
      }
    }
  `]
})
export class PopupContainerComponent implements OnInit {
  popups = signal<any[]>([]);

  constructor(private popupService: PopupService) {
    // Subscribe to popup updates
    effect(() => {
      this.popups.set(this.popupService.popups$());
    });
  }

  ngOnInit(): void {
    // Handle ESC key to close popups
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.popups().length > 0) {
        const topPopup = this.popups()[this.popups().length - 1];
        if (topPopup.closable) {
          this.closePopup(topPopup.id);
        }
      }
    });
  }

  trackByPopupId(index: number, popup: any): string {
    return popup.id;
  }

  getPopupClasses(popup: any): string {
    return `popup-${popup.type} ${popup.customClass || ''}`;
  }

  getIconClass(icon: string): string {
    // Map icon names to CSS classes or return custom class
    const iconMap: Record<string, string> = {
      'question': 'fas fa-question-circle',
      'check-circle': 'fas fa-check-circle',
      'exclamation-triangle': 'fas fa-exclamation-triangle',
      'times-circle': 'fas fa-times-circle',
      'info': 'fas fa-info-circle',
      'spinner': 'fas fa-spinner fa-spin',
      'sign-out': 'fas fa-sign-out-alt',
      'wifi-slash': 'fas fa-wifi-slash',
      'network-wired': 'fas fa-network-wired',
      'clock': 'fas fa-clock',
      'clock-o': 'far fa-clock'
    };

    return iconMap[icon] || icon;
  }

  // Determine whether to show icon for a popup
  shouldShowIcon(popup: any): boolean {
    return popup.type !== 'loading'; // Show icons for all types except loading
  }

  // Get the appropriate icon for a popup
  getPopupIcon(popup: any): string {
    if (popup.icon) {
      return popup.icon;
    }

    // Default icons based on popup type
    const defaultIcons: Record<string, string> = {
      'confirm': 'question',
      'alert': 'info',
      'form': 'info',
      'custom': 'info'
    };

    return defaultIcons[popup.type] || 'info';
  }

  // Get additional CSS classes for popup icon
  getPopupIconClasses(popup: any): string {
    const icon = this.getPopupIcon(popup);
    return `icon-${icon}`;
  }

  onBackdropClick(popup: any, event: MouseEvent): void {
    if (popup.backdrop && popup.closable) {
      this.closePopup(popup.id);
    }
  }

  closePopup(popupId: string): void {
    this.popupService.close('close', undefined, popupId);
  }

  handleButtonClick(button: PopupButton, popup: any): void {
    if (button.disabled || button.loading) {
      return;
    }

    // Handle form submission
    if (popup.type === 'form' && button.label.toLowerCase().includes('submit')) {
      this.popupService.close('submit', popup.data?.values, popup.id);
      return;
    }

    // Execute button action
    if (button.action) {
      const result = button.action();
      
      // Handle async actions
      if (result instanceof Promise) {
        // Show loading state
        this.popupService.updateButton(popup.id, button.label, { loading: true, disabled: true });
        
        result
          .then(() => {
            // Action completed successfully
          })
          .catch((error) => {
            console.error('Popup button action failed:', error);
          })
          .finally(() => {
            // Reset button state
            this.popupService.updateButton(popup.id, button.label, { loading: false, disabled: false });
          });
      }
    }
  }
}
