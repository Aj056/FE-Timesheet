import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type PopupType = 'confirm' | 'alert' | 'custom' | 'loading' | 'form';

export interface PopupButton {
  label: string;
  action: () => void | Promise<void>;
  style?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  disabled?: boolean;
  loading?: boolean;
}

export interface PopupConfig {
  id?: string;
  type: PopupType;
  title: string;
  message?: string;
  html?: string; // For custom HTML content
  icon?: string; // Icon class or SVG
  buttons?: PopupButton[];
  closable?: boolean;
  backdrop?: boolean; // Click outside to close
  persistent?: boolean; // Prevent closing
  width?: string;
  height?: string;
  customClass?: string;
  data?: any; // Custom data for form popups
  onOpen?: () => void;
  onClose?: () => void;
}

export interface PopupResult {
  action: string;
  data?: any;
}

interface ActivePopup extends PopupConfig {
  id: string;
  resolve: (result: PopupResult) => void;
  reject: (reason?: any) => void;
}

@Injectable({
  providedIn: 'root'
})
export class PopupService {
  private popups = signal<ActivePopup[]>([]);
  private popupCounter = 0;

  // Public signal for components to subscribe to
  public popups$ = this.popups.asReadonly();

  constructor() {}

  /**
   * Show a confirmation dialog
   */
  confirm(config: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmStyle?: PopupButton['style'];
    icon?: string;
  }): Promise<PopupResult> {
    return this.show({
      type: 'confirm',
      title: config.title,
      message: config.message,
      icon: config.icon || 'question',
      buttons: [
        {
          label: config.cancelText || 'Cancel',
          action: () => this.close('cancel'),
          style: 'secondary'
        },
        {
          label: config.confirmText || 'Confirm',
          action: () => this.close('confirm'),
          style: config.confirmStyle || 'primary'
        }
      ],
      closable: true,
      backdrop: true
    });
  }

  /**
   * Show an alert dialog
   */
  alert(config: {
    title: string;
    message: string;
    buttonText?: string;
    icon?: string;
    type?: 'info' | 'success' | 'warning' | 'error';
  }): Promise<PopupResult> {
    const iconMap = {
      info: 'info',
      success: 'check-circle',
      warning: 'exclamation-triangle',
      error: 'times-circle'
    };

    return this.show({
      type: 'alert',
      title: config.title,
      message: config.message,
      icon: config.icon || iconMap[config.type || 'info'],
      buttons: [
        {
          label: config.buttonText || 'OK',
          action: () => this.close('ok'),
          style: config.type === 'error' ? 'danger' : 'primary'
        }
      ],
      closable: true,
      backdrop: true
    });
  }

  /**
   * Show a loading popup
   */
  loading(config: {
    title: string;
    message?: string;
  }): string {
    return this.showSync({
      type: 'loading',
      title: config.title,
      message: config.message || 'Please wait...',
      icon: 'spinner',
      closable: false,
      backdrop: false,
      persistent: true
    });
  }

  /**
   * Show a custom popup
   */
  custom(config: Omit<PopupConfig, 'type'>): Promise<PopupResult> {
    return this.show({
      ...config,
      type: 'custom'
    });
  }

  /**
   * Show logout confirmation popup
   */
  logoutConfirm(): Promise<PopupResult> {
    return this.confirm({
      title: 'Confirm Logout',
      message: 'Are you sure you want to logout? Any unsaved changes will be lost.',
      confirmText: 'Logout',
      cancelText: 'Stay Logged In',
      confirmStyle: 'danger',
      icon: 'sign-out'
    });
  }

  /**
   * Show network error popup
   */
  networkError(config?: {
    title?: string;
    message?: string;
    onRetry?: () => void;
  }): Promise<PopupResult> {
    return this.show({
      type: 'alert',
      title: config?.title || 'Network Error',
      message: config?.message || 'Unable to connect to the server. Please check your internet connection and try again.',
      icon: 'wifi-slash',
      buttons: [
        {
          label: 'Dismiss',
          action: () => this.close('dismiss'),
          style: 'secondary'
        },
        ...(config?.onRetry ? [
          {
            label: 'Retry',
            action: () => {
              config.onRetry!();
              this.close('retry');
            },
            style: 'primary' as const
          }
        ] : [])
      ],
      closable: true,
      backdrop: true
    });
  }

  /**
   * Show office network requirement popup
   */
  officeNetworkRequired(currentIP?: string): Promise<PopupResult> {
    const message = currentIP 
      ? `You must be connected to the office network to perform this action.\n\nCurrent IP: ${currentIP}\nRequired IP: 49.37.212.xxx`
      : 'You must be connected to the office network to perform this action.';

    return this.show({
      type: 'alert',
      title: 'Office Network Required',
      message,
      icon: 'network-wired',
      buttons: [
        {
          label: 'Dismiss',
          action: () => this.close('dismiss'),
          style: 'secondary'
        },
        {
          label: 'Check Network',
          action: () => this.close('check-network'),
          style: 'primary'
        }
      ],
      closable: true,
      backdrop: true
    });
  }

  /**
   * Show attendance confirmation
   */
  attendanceConfirm(type: 'checkin' | 'checkout', additionalInfo?: string): Promise<PopupResult> {
    const isCheckIn = type === 'checkin';
    const title = isCheckIn ? 'Confirm Check-in' : 'Confirm Check-out';
    const message = isCheckIn 
      ? `Ready to start your workday?${additionalInfo ? '\n' + additionalInfo : ''}`
      : `Ready to end your workday?${additionalInfo ? '\n' + additionalInfo : ''}`;

    return this.confirm({
      title,
      message,
      confirmText: isCheckIn ? 'Check In' : 'Check Out',
      cancelText: 'Cancel',
      confirmStyle: 'success'
    });
  }

  /**
   * Show a form popup
   */
  form(config: {
    title: string;
    fields: FormField[];
    submitText?: string;
    cancelText?: string;
    data?: any;
  }): Promise<PopupResult> {
    return this.show({
      type: 'form',
      title: config.title,
      data: {
        fields: config.fields,
        values: config.data || {}
      },
      buttons: [
        {
          label: config.cancelText || 'Cancel',
          action: () => this.close('cancel'),
          style: 'secondary'
        },
        {
          label: config.submitText || 'Submit',
          action: () => this.close('submit'),
          style: 'primary'
        }
      ],
      closable: true,
      backdrop: true
    });
  }

  /**
   * Close a specific popup
   */
  close(action: string = 'close', data?: any, popupId?: string): void {
    const popups = this.popups();
    const targetPopup = popupId 
      ? popups.find(p => p.id === popupId)
      : popups[popups.length - 1]; // Close topmost popup

    if (targetPopup) {
      targetPopup.resolve({ action, data });
      this.removePopup(targetPopup.id);
    }
  }

  /**
   * Close all popups
   */
  closeAll(): void {
    const popups = this.popups();
    popups.forEach(popup => {
      popup.resolve({ action: 'close-all' });
    });
    this.popups.set([]);
  }

  /**
   * Update popup button state (e.g., loading)
   */
  updateButton(popupId: string, buttonLabel: string, updates: Partial<PopupButton>): void {
    this.popups.update(popups => 
      popups.map(popup => {
        if (popup.id === popupId && popup.buttons) {
          return {
            ...popup,
            buttons: popup.buttons.map(button => 
              button.label === buttonLabel 
                ? { ...button, ...updates }
                : button
            )
          };
        }
        return popup;
      })
    );
  }

  /**
   * Check if any popup is open
   */
  hasOpenPopups(): boolean {
    return this.popups().length > 0;
  }

  /**
   * Get specific popup by ID
   */
  getPopup(id: string): ActivePopup | undefined {
    return this.popups().find(popup => popup.id === id);
  }

  /**
   * Internal method to show popup and return promise
   */
  private show(config: PopupConfig): Promise<PopupResult> {
    return new Promise((resolve, reject) => {
      const id = this.generateId();
      const popup: ActivePopup = {
        id,
        ...config,
        resolve,
        reject
      };

      this.popups.update(current => [...current, popup]);

      // Call onOpen callback if provided
      if (config.onOpen) {
        config.onOpen();
      }
    });
  }

  /**
   * Internal method to show popup synchronously (for loading popups)
   */
  private showSync(config: PopupConfig): string {
    const id = this.generateId();
    const popup: ActivePopup = {
      id,
      ...config,
      resolve: () => {},
      reject: () => {}
    };

    this.popups.update(current => [...current, popup]);

    // Call onOpen callback if provided
    if (config.onOpen) {
      config.onOpen();
    }

    return id;
  }

  /**
   * Remove popup from array
   */
  private removePopup(id: string): void {
    const popup = this.getPopup(id);
    if (popup?.onClose) {
      popup.onClose();
    }

    this.popups.update(current => current.filter(p => p.id !== id));
  }

  /**
   * Generate unique popup ID
   */
  private generateId(): string {
    return `popup_${++this.popupCounter}_${Date.now()}`;
  }
}

// Interface for form fields
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio';
  required?: boolean;
  placeholder?: string;
  options?: { value: any; label: string }[]; // For select, radio
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}
