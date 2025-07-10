import { Injectable, ErrorHandler } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandlerService implements ErrorHandler {
  
  handleError(error: any): void {
    console.error('Global Error Handler:', error);
    
    if (error instanceof HttpErrorResponse) {
      this.handleHttpError(error);
    } else {
      this.handleGenericError(error);
    }
  }

  private handleHttpError(error: HttpErrorResponse): void {
    let userMessage = 'An error occurred. Please try again.';
    
    switch (error.status) {
      case 0:
        userMessage = 'Network error. Please check your connection.';
        break;
      case 400:
        userMessage = 'Invalid request. Please check your input.';
        break;
      case 401:
        userMessage = 'Authentication failed. Please log in again.';
        // Redirect to login or refresh token
        break;
      case 403:
        userMessage = 'Access denied. You do not have permission.';
        break;
      case 404:
        userMessage = 'Resource not found.';
        break;
      case 429:
        userMessage = 'Too many requests. Please wait and try again.';
        break;
      case 500:
        userMessage = 'Server error. Please try again later.';
        break;
      case 503:
        userMessage = 'Service unavailable. Please try again later.';
        break;
      default:
        userMessage = `Error ${error.status}: ${error.message}`;
    }
    
    this.showUserNotification(userMessage, 'error');
  }

  private handleGenericError(error: any): void {
    let userMessage = 'An unexpected error occurred.';
    
    if (error?.message) {
      // Log the technical error
      console.error('Technical Error:', error.message);
      console.error('Stack:', error.stack);
      
      // Provide user-friendly message
      if (error.message.includes('ChunkLoadError')) {
        userMessage = 'Application update detected. Please refresh the page.';
      } else if (error.message.includes('Network')) {
        userMessage = 'Network connection issue. Please check your internet.';
      }
    }
    
    this.showUserNotification(userMessage, 'error');
  }

  private showUserNotification(message: string, type: 'error' | 'warning' | 'info'): void {
    // For now, use console and alert
    // In production, this should integrate with a proper notification service
    console.log(`${type.toUpperCase()}: ${message}`);
    
    if (type === 'error') {
      // Only show critical errors to users
      if (message.includes('Authentication') || 
          message.includes('Network') || 
          message.includes('refresh')) {
        alert(message);
      }
    }
  }

  // Method for components to manually report errors
  public reportError(error: any, context?: string): void {
    console.error(`Error in ${context || 'Unknown Context'}:`, error);
    this.handleError(error);
  }

  // Method for logging security events
  public logSecurityEvent(event: string, details?: any): void {
    const securityLog = {
      timestamp: new Date().toISOString(),
      event,
      details: details || {},
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    console.warn('SECURITY EVENT:', securityLog);
    
    // In production, send to security monitoring service
    // this.sendToSecurityService(securityLog);
  }
}
