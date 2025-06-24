import { Component } from '@angular/core';
import { EmployeeBatch } from '../employee-batch/employee-batch';
import { EmployeeloginForm } from '../employeelogin-form/employeelogin-form'
import { RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-employeecomponent',
  imports: [EmployeeBatch, EmployeeloginForm,RouterOutlet ],
  templateUrl: './employeecomponent.html',
  styleUrl: './employeecomponent.scss'
})
export class Employeecomponent {

}
