import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, timer } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  timestamp: Date;
  actions?: ToastAction[];
}

export interface ToastAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary';
}

export interface ToastConfig {
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: ToastAction[];
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts = signal<Toast[]>([]);
  private maxToasts = 5;
  private defaultDuration = 5000; // 5 seconds
  
  // Public signal for components to subscribe to
  public toasts$ = this.toasts.asReadonly();

  constructor() {}

  /**
   * Show a success toast
   */
  success(config: ToastConfig | string): string {
    const toastConfig = typeof config === 'string' 
      ? { message: config, title: 'Success' } 
      : { title: 'Success', ...config };
    
    return this.addToast('success', toastConfig);
  }

  /**
   * Show an error toast
   */
  error(config: ToastConfig | string): string {
    const toastConfig = typeof config === 'string' 
      ? { message: config, title: 'Error', persistent: true } 
      : { title: 'Error', persistent: true, ...config };
    
    return this.addToast('error', toastConfig);
  }

  /**
   * Show a warning toast
   */
  warning(config: ToastConfig | string): string {
    const toastConfig = typeof config === 'string' 
      ? { message: config, title: 'Warning', duration: 7000 } 
      : { title: 'Warning', duration: 7000, ...config };
    
    return this.addToast('warning', toastConfig);
  }

  /**
   * Show an info toast
   */
  info(config: ToastConfig | string): string {
    const toastConfig = typeof config === 'string' 
      ? { message: config, title: 'Info' } 
      : { title: 'Info', ...config };
    
    return this.addToast('info', toastConfig);
  }

  /**
   * Add a toast with specific type
   */
  private addToast(type: Toast['type'], config: ToastConfig): string {
    const id = this.generateId();
    
    const toast: Toast = {
      id,
      type,
      title: config.title || this.getDefaultTitle(type),
      message: config.message,
      duration: config.duration ?? this.defaultDuration,
      persistent: config.persistent ?? false,
      timestamp: new Date(),
      actions: config.actions
    };

    // Smart handling: Remove duplicate messages
    this.removeDuplicates(toast.message);
    
    // Smart handling: Limit number of toasts
    this.enforceLimit();
    
    // Add the new toast
    this.toasts.update(current => [...current, toast]);
    
    // Auto-remove if not persistent
    if (!toast.persistent && toast.duration && toast.duration > 0) {
      timer(toast.duration).subscribe(() => {
        this.remove(id);
      });
    }
    
    return id;
  }

  /**
   * Remove a specific toast by ID
   */
  remove(id: string): void {
    this.toasts.update(current => current.filter(toast => toast.id !== id));
  }

  /**
   * Remove all toasts
   */
  clear(): void {
    this.toasts.set([]);
  }

  /**
   * Remove all toasts of a specific type
   */
  clearByType(type: Toast['type']): void {
    this.toasts.update(current => current.filter(toast => toast.type !== type));
  }

  /**
   * Update an existing toast
   */
  update(id: string, updates: Partial<Toast>): void {
    this.toasts.update(current => 
      current.map(toast => 
        toast.id === id ? { ...toast, ...updates } : toast
      )
    );
  }

  /**
   * Get current toasts count
   */
  getCount(): number {
    return this.toasts().length;
  }

  /**
   * Get current toasts count by type
   */
  getCountByType(type: Toast['type']): number {
    return this.toasts().filter(toast => toast.type === type).length;
  }

  /**
   * Check if a specific toast exists
   */
  exists(id: string): boolean {
    return this.toasts().some(toast => toast.id === id);
  }

  /**
   * Smart duplicate removal - removes toasts with same message
   */
  private removeDuplicates(message: string): void {
    this.toasts.update(current => 
      current.filter(toast => toast.message !== message)
    );
  }

  /**
   * Enforce maximum number of toasts (FIFO)
   */
  private enforceLimit(): void {
    const current = this.toasts();
    if (current.length >= this.maxToasts) {
      // Remove oldest non-persistent toasts first
      const nonPersistent = current.filter(t => !t.persistent);
      const persistent = current.filter(t => t.persistent);
      
      if (nonPersistent.length > 0) {
        // Remove oldest non-persistent
        const toRemove = nonPersistent[0];
        this.remove(toRemove.id);
      } else if (persistent.length >= this.maxToasts) {
        // If all are persistent, remove oldest
        const toRemove = persistent[0];
        this.remove(toRemove.id);
      }
    }
  }

  /**
   * Generate unique toast ID
   */
  private generateId(): string {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get default title for toast type
   */
  private getDefaultTitle(type: Toast['type']): string {
    const titles = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information'
    };
    return titles[type];
  }

  /**
   * Configuration methods
   */
  setMaxToasts(max: number): void {
    this.maxToasts = max;
  }

  setDefaultDuration(duration: number): void {
    this.defaultDuration = duration;
  }

  /**
   * Utility methods for common scenarios
   */
  
  // Network-related toasts
  networkError(): string {
    return this.error({
      title: 'Network Error',
      message: 'Please check your internet connection and try again.',
      actions: [
        {
          label: 'Retry',
          action: () => window.location.reload(),
          style: 'primary'
        }
      ]
    });
  }

  // Authentication-related toasts
  loginSuccess(username?: string): string {
    return this.success({
      title: 'Welcome!',
      message: username ? `Hello ${username}, you're successfully logged in.` : 'You\'re successfully logged in.',
      duration: 3000
    });
  }

  loginError(): string {
    return this.error({
      title: 'Login Failed',
      message: 'Invalid credentials. Please check your username and password.',
    });
  }

  // Office network toasts
  officeNetworkRequired(): string {
    return this.warning({
      title: 'Office Network Required',
      message: 'You must be connected to the office network to perform this action.',
      persistent: true,
      actions: [
        {
          label: 'Check Network',
          action: () => window.location.reload(),
          style: 'primary'
        }
      ]
    });
  }

  // Attendance-related toasts
  checkInSuccess(time: string): string {
    return this.success({
      title: 'Check-in Successful',
      message: `You've successfully checked in at ${time}. Have a productive day!`,
      duration: 4000
    });
  }

  checkOutSuccess(time: string, workingHours: string): string {
    return this.success({
      title: 'Check-out Successful',
      message: `You've checked out at ${time}. Total working time: ${workingHours}. Great job today!`,
      duration: 5000
    });
  }

  minimumTimeWarning(remainingTime: string): string {
    return this.warning({
      title: 'Minimum Time Required',
      message: `Please wait ${remainingTime} before checking out. Minimum 30 minutes required.`,
      duration: 6000
    });
  }
}
