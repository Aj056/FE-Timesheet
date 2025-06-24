import { Component } from '@angular/core';
import {Router} from '@angular/router'
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-employees-list',
  imports: [CommonModule],
  templateUrl: './employees-list.html',
  styleUrl: './employees-list.scss'
})
export class EmployeesList {
  constructor(private router:Router){

  }
  employees = [
    {
      id: 'EMP001',
      name: 'John Doe',
      role: 'employee',
      status: 'active'
    },
    {
      id: 'EMP001',
      name: 'John Doe',
      role: 'employee',
      status: 'active'
    },
    {
      id: 'EMP001',
      name: 'John Doe',
      role: 'employee',
      status: 'active'
    },
    
  ]

  viewDetails(id: string) {
    this.router.navigate(['/admin/employees', id, 'edit']);
  }

  viewLogs(id: string) {
    this.router.navigate(['/admin/employees', id, 'logs']);
  }

}
