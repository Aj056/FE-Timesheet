import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminNav} from '../admin-nav/admin-nav';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';
import { PopupContainerComponent } from '../../shared/components/popup-container/popup-container.component';

@Component({
  selector: 'app-admin-component',
  standalone: true,
  imports: [CommonModule, AdminNav, RouterOutlet, ToastContainerComponent, PopupContainerComponent],
  templateUrl: './admin-component.html',
  styleUrls: ['./admin-component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AdminComponent {}
