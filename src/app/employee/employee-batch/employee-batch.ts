import { Component } from '@angular/core';
import {Logoutcomponent} from '../../shared/components/logoutcomponent/logoutcomponent';
import { RouterModule,} from "@angular/router";
@Component({
  selector: 'app-employee-batch',
  imports: [Logoutcomponent,RouterModule],
  templateUrl: './employee-batch.html',
  styleUrl: './employee-batch.scss'
})
export class EmployeeBatch {
isopen:boolean = false
open_pop(){
  this.isopen = !this.isopen;
}
}
