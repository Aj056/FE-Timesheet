import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SeoService } from './core/services/seo.service';
import { SessionWarningComponent } from './shared/components/session-warning.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { PopupContainerComponent } from './shared/components/popup-container/popup-container.component';
import { environment } from '../environments/environment.prod';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SessionWarningComponent, ToastContainerComponent, PopupContainerComponent],
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected title = environment.appFullName;

  constructor(
    private seoService: SeoService
  ) {}

  ngOnInit(): void {
    // Initialize SEO with default settings
    this.seoService.resetToDefault();
  }
}
