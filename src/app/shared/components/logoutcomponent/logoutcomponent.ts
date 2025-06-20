import { Component } from '@angular/core';
import { Authservice } from '../../../core/services/auth.service';

@Component({
  selector: 'app-logoutcomponent',
  imports: [],
  templateUrl: './logoutcomponent.html',
  styleUrl: './logoutcomponent.scss'
})
export class Logoutcomponent {
   constructor(private auth:Authservice){}
  logout() {
     this.auth.logout()
  }
}
