import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-session-warning',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="showWarning" class="session-warning-overlay">
      <div class="session-warning-modal">
        <div class="session-warning-header">
          <h3>Session Expiring Soon</h3>
        </div>
        <div class="session-warning-body">
          <p>Your session will expire in <strong>{{remainingTime}}</strong> minutes.</p>
          <p>Would you like to extend your session?</p>
        </div>
        <div class="session-warning-actions">
          <button class="btn btn-primary" (click)="extendSession()">
            Extend Session
          </button>
          <button class="btn btn-secondary" (click)="logout()">
            Logout Now
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .session-warning-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }

    .session-warning-modal {
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .session-warning-header h3 {
      margin: 0 0 16px 0;
      color: #d32f2f;
      font-size: 1.2em;
    }

    .session-warning-body {
      margin-bottom: 24px;
      line-height: 1.5;
    }

    .session-warning-body p {
      margin: 0 0 8px 0;
    }

    .session-warning-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9em;
      transition: background-color 0.2s;
    }

    .btn-primary {
      background-color: #1976d2;
      color: white;
    }

    .btn-primary:hover {
      background-color: #1565c0;
    }

    .btn-secondary {
      background-color: #757575;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #616161;
    }
  `]
})
export class SessionWarningComponent implements OnInit, OnDestroy {
  showWarning = false;
  remainingTime = 5; // minutes
  private subscription?: Subscription;
  private countdownInterval?: any;

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    // Simplified session warning - can be enhanced later with proper session management
    console.log('Session warning component initialized');
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.stopCountdown();
  }

  extendSession(): void {
    // For now, just hide the warning
    this.showWarning = false;
    this.stopCountdown();
    console.log('Session extended (placeholder implementation)');
  }

  logout(): void {
    this.auth.logout();
    this.showWarning = false;
    this.stopCountdown();
  }

  private startCountdown(): void {
    this.remainingTime = 5;
    this.countdownInterval = setInterval(() => {
      this.remainingTime--;
      if (this.remainingTime <= 0) {
        this.logout();
      }
    }, 60000); // Update every minute
  }

  private stopCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }
}
