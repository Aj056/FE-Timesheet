import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ValidationService {

  // Validate username format
  validateUsername(username: string): boolean {
    if (!username || username.trim().length === 0) {
      return false;
    }
    // Allow alphanumeric characters and underscore, 3-50 characters
    const usernamePattern = /^[a-zA-Z0-9_]{3,50}$/;
    return usernamePattern.test(username.trim());
  }

  // Validate email format
  validateEmail(email: string): boolean {
    if (!email || email.trim().length === 0) {
      return false;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email.trim());
  }

  // Validate password strength
  validatePassword(password: string): boolean {
    if (!password) {
      return false;
    }
    // Minimum 4 characters for demo purposes
    return password.length >= 4;
  }

  // Sanitize input to prevent XSS
  sanitizeInput(input: string): string {
    if (!input) return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/['"]/g, '') // Remove quotes
      .replace(/javascript:/gi, '') // Remove javascript protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  }

  // Validate employee name
  validateName(name: string): boolean {
    if (!name || name.trim().length === 0) {
      return false;
    }
    // Allow letters, spaces, hyphens, and apostrophes, 2-100 characters
    const namePattern = /^[a-zA-Z\s\-']{2,100}$/;
    return namePattern.test(name.trim());
  }

  // Validate date format (YYYY-MM-DD)
  validateDate(date: string): boolean {
    if (!date) return false;
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(date)) return false;
    
    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
  }

  // Generic validation for required fields
  isRequired(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  }

  // Validate phone number (basic format)
  validatePhone(phone: string): boolean {
    if (!phone) return false;
    const phonePattern = /^[\d\s\-\+\(\)]{10,15}$/;
    return phonePattern.test(phone.trim());
  }
}
