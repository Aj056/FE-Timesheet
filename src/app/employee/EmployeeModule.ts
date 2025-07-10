import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { Employeecomponent } from "./employeecomponent/employeecomponent";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

const routes:Routes =[
    {path:'',
        component:Employeecomponent,
    },
    {
      path:'profile',
      loadComponent: () => import('./employee-profile/employee-profile').then(m => m.EmployeeProfile)
          
    },
    {
      path:'payslip',
      loadComponent: () => import('./payslip-download/payslip-download').then(m => m.PayslipDownloadComponent)
    }
]

@NgModule({
    declarations:[],
    imports:[RouterModule.forChild(routes),CommonModule,FormsModule]
})
export class EmployeeModule{

}