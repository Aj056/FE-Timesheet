import { Component } from '@angular/core';
import { AdminNav} from '../admin-nav/admin-nav';
import { RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-admin-component',
  standalone: true,
  imports: [AdminNav, RouterOutlet],
  templateUrl: './admin-component.html',
  styleUrls: ['./admin-component.scss']
})
export class AdminComponent { }
