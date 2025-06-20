import { Component } from '@angular/core';
import { Logoutcomponent } from '../../shared/components/logoutcomponent/logoutcomponent';

@Component({
  selector: 'app-admin-component',
  standalone: true,
  imports: [Logoutcomponent],
  templateUrl: './admin-component.html',
  styleUrls: ['./admin-component.scss']
})
export class AdminComponent { }
