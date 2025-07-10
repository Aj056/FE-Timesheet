import { Injectable } from '@angular/core';

export interface PasswordRequirement {
  key: string;
  label: string;
  met: boolean;
  required: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  strength: number; // 0-100
  requirements: PasswordRequirement[];
  score: {
    length: number;
    complexity: number;
    uniqueness: number;
    total: number;
  };
}

@Injectable({ providedIn: 'root' })
export class PasswordSecurityService {
  
  // Common passwords to check against
  private readonly commonPasswords = [
    '123456', 'password', '123456789', '12345678', '12345',
    '1234567', '1234567890', 'qwerty', 'abc123', '111111',
    'password123', 'admin', 'login', 'welcome', 'monkey',
    'letmein', 'dragon', 'master', 'hello', 'freedom'
  ];

  // Weak patterns to avoid
  private readonly weakPatterns = [
    /(.)\1{2,}/, // Repeated characters (aaa, 111)
    /123+/, // Sequential numbers
    /abc+/i, // Sequential letters
    /qwerty/i, // Keyboard patterns
    /password/i, // Contains "password"
    /admin/i // Contains "admin"
  ];

  /**
   * Comprehensive password validation with security scoring
   */
  validatePassword(password: string): PasswordValidationResult {
    if (!password) {
      return this.createEmptyResult();
    }

    const requirements = this.checkRequirements(password);
    const score = this.calculateScore(password);
    const strength = this.calculateStrength(score, requirements);
    
    return {
      isValid: this.isPasswordValid(requirements),
      strength,
      requirements,
      score
    };
  }

  /**
   * Check if password meets minimum security requirements
   */
  meetsMinimumRequirements(password: string): boolean {
    const result = this.validatePassword(password);
    return result.isValid;
  }

  /**
   * Get password strength level (weak, fair, good, strong)
   */
  getStrengthLevel(password: string): string {
    const strength = this.validatePassword(password).strength;
    
    if (strength < 25) return 'weak';
    if (strength < 50) return 'fair';
    if (strength < 75) return 'good';
    return 'strong';
  }

  /**
   * Generate secure password suggestions
   */
  generateSecurePassword(length: number = 12): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';
    
    // Ensure at least one character from each category
    password += this.getRandomChar(lowercase);
    password += this.getRandomChar(uppercase);
    password += this.getRandomChar(numbers);
    password += this.getRandomChar(symbols);
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += this.getRandomChar(allChars);
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Hash password for client-side validation (not for storage!)
   */
  async hashPasswordForValidation(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'client_salt_2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Private helper methods

  private createEmptyResult(): PasswordValidationResult {
    return {
      isValid: false,
      strength: 0,
      requirements: this.getRequirementsList(''),
      score: { length: 0, complexity: 0, uniqueness: 0, total: 0 }
    };
  }

  private checkRequirements(password: string): PasswordRequirement[] {
    return [
      {
        key: 'minLength',
        label: 'At least 8 characters long',
        met: password.length >= 8,
        required: true
      },
      {
        key: 'hasUppercase',
        label: 'Contains uppercase letter (A-Z)',
        met: /[A-Z]/.test(password),
        required: true
      },
      {
        key: 'hasLowercase',
        label: 'Contains lowercase letter (a-z)',
        met: /[a-z]/.test(password),
        required: true
      },
      {
        key: 'hasNumbers',
        label: 'Contains at least one number (0-9)',
        met: /\d/.test(password),
        required: true
      },
      {
        key: 'hasSpecialChars',
        label: 'Contains special character (!@#$%^&*)',
        met: /[!@#$%^&*()_+\-=\[\]{}|;':\",./<>?]/.test(password),
        required: true
      },
      {
        key: 'notCommon',
        label: 'Not a commonly used password',
        met: !this.isCommonPassword(password),
        required: true
      },
      {
        key: 'noWeakPatterns',
        label: 'No repeated or sequential patterns',
        met: !this.hasWeakPatterns(password),
        required: true
      },
      {
        key: 'goodLength',
        label: 'At least 12 characters (recommended)',
        met: password.length >= 12,
        required: false
      },
      {
        key: 'excellentLength',
        label: 'At least 16 characters (excellent)',
        met: password.length >= 16,
        required: false
      }
    ];
  }

  private calculateScore(password: string): any {
    let lengthScore = 0;
    let complexityScore = 0;
    let uniquenessScore = 0;

    // Length scoring (0-40 points)
    if (password.length >= 8) lengthScore += 15;
    if (password.length >= 12) lengthScore += 15;
    if (password.length >= 16) lengthScore += 10;
    
    // Complexity scoring (0-40 points)
    if (/[a-z]/.test(password)) complexityScore += 5;
    if (/[A-Z]/.test(password)) complexityScore += 5;
    if (/\d/.test(password)) complexityScore += 5;
    if (/[!@#$%^&*()_+\-=\[\]{}|;':\",./<>?]/.test(password)) complexityScore += 10;
    
    // Character variety bonus
    const uniqueChars = new Set(password.split('')).size;
    if (uniqueChars >= password.length * 0.7) complexityScore += 15;

    // Uniqueness scoring (0-20 points)
    if (!this.isCommonPassword(password)) uniquenessScore += 10;
    if (!this.hasWeakPatterns(password)) uniquenessScore += 10;

    const total = lengthScore + complexityScore + uniquenessScore;

    return {
      length: lengthScore,
      complexity: complexityScore,
      uniqueness: uniquenessScore,
      total
    };
  }

  private calculateStrength(score: any, requirements: PasswordRequirement[]): number {
    const requiredMet = requirements.filter(r => r.required && r.met).length;
    const totalRequired = requirements.filter(r => r.required).length;
    
    // Base strength from required requirements (60%)
    const requirementStrength = (requiredMet / totalRequired) * 60;
    
    // Additional strength from score (40%)
    const scoreStrength = (score.total / 100) * 40;
    
    return Math.min(100, Math.round(requirementStrength + scoreStrength));
  }

  private isPasswordValid(requirements: PasswordRequirement[]): boolean {
    return requirements.filter(r => r.required).every(r => r.met);
  }

  private isCommonPassword(password: string): boolean {
    const lower = password.toLowerCase();
    return this.commonPasswords.includes(lower) ||
           this.commonPasswords.some(common => lower.includes(common));
  }

  private hasWeakPatterns(password: string): boolean {
    return this.weakPatterns.some(pattern => pattern.test(password));
  }

  private getRequirementsList(password: string): PasswordRequirement[] {
    return this.checkRequirements(password);
  }

  private getRandomChar(chars: string): string {
    return chars.charAt(Math.floor(Math.random() * chars.length));
  }

  /**
   * Additional security utilities
   */

  /**
   * Check if password has been compromised (mock implementation)
   * In production, integrate with HaveIBeenPwned API
   */
  async checkPasswordBreach(password: string): Promise<boolean> {
    // Mock implementation - in production, use HaveIBeenPwned API
    const hash = await this.hashPasswordForValidation(password);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check against common breached passwords (simplified)
    const commonBreachedPatterns = [
      'password123', '123456789', 'qwerty123', 'admin123'
    ];
    
    return commonBreachedPatterns.some(pattern => 
      password.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Calculate entropy of password
   */
  calculateEntropy(password: string): number {
    let charSpace = 0;
    
    if (/[a-z]/.test(password)) charSpace += 26;
    if (/[A-Z]/.test(password)) charSpace += 26;
    if (/\d/.test(password)) charSpace += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charSpace += 32;
    
    return Math.log2(Math.pow(charSpace, password.length));
  }

  /**
   * Get password strength color for UI
   */
  getStrengthColor(strength: number): string {
    if (strength < 25) return '#dc3545'; // Red
    if (strength < 50) return '#fd7e14'; // Orange
    if (strength < 75) return '#ffc107'; // Yellow
    return '#28a745'; // Green
  }

  /**
   * Get recommendations for improving password
   */
  getImprovementSuggestions(password: string): string[] {
    const requirements = this.checkRequirements(password);
    const suggestions: string[] = [];
    
    requirements
      .filter(req => req.required && !req.met)
      .forEach(req => {
        switch (req.key) {
          case 'minLength':
            suggestions.push('Make your password at least 8 characters long');
            break;
          case 'hasUppercase':
            suggestions.push('Add at least one uppercase letter (A-Z)');
            break;
          case 'hasLowercase':
            suggestions.push('Add at least one lowercase letter (a-z)');
            break;
          case 'hasNumbers':
            suggestions.push('Add at least one number (0-9)');
            break;
          case 'hasSpecialChars':
            suggestions.push('Add a special character (!@#$%^&*)');
            break;
          case 'notCommon':
            suggestions.push('Avoid common passwords like "password123"');
            break;
          case 'noWeakPatterns':
            suggestions.push('Avoid repeated characters or simple patterns');
            break;
        }
      });

    // Additional suggestions for stronger passwords
    if (password.length < 12) {
      suggestions.push('Consider using 12 or more characters for better security');
    }

    return suggestions;
  }
}
