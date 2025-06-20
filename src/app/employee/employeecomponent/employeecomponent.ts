import { Component } from '@angular/core';
import { Logoutcomponent } from '../../shared/components/logoutcomponent/logoutcomponent';
@Component({
  selector: 'app-employeecomponent',
  imports: [Logoutcomponent],
  templateUrl: './employeecomponent.html',
  styleUrl: './employeecomponent.scss'
})
export class Employeecomponent {
logout(){
  alert('hello')
}
}
