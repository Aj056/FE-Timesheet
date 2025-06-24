import { Component } from '@angular/core';
import { Logoutcomponent } from '../../shared/components/logoutcomponent/logoutcomponent';
import { RouterModule,} from "@angular/router";
@Component({
  selector: 'app-admin-nav',
  imports: [Logoutcomponent,RouterModule],
  templateUrl: './admin-nav.html',
  styleUrl: './admin-nav.scss'
})
export class AdminNav {

}
