import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { SeoService } from './core/services/seo.service';
import { SessionWarningComponent } from './shared/components/session-warning.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { PopupContainerComponent } from './shared/components/popup-container/popup-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SessionWarningComponent, ToastContainerComponent, PopupContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected title = 'Willware Timesheet - Employee Attendance Management';

  constructor(
    private themeService: ThemeService,
    private seoService: SeoService
  ) {}

  ngOnInit(): void {
    // Initialize SEO with default settings
    this.seoService.resetToDefault();
    
    // Theme service automatically initializes theme on construction
    console.log('Application initialized with theme service, SEO optimization, and security features');
  }
}
