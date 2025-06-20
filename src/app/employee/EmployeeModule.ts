import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { Employeecomponent } from "./employeecomponent/employeecomponent";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

const routes:Routes =[
    {path:'',component:Employeecomponent}
]

@NgModule({
    declarations:[],
    imports:[RouterModule.forChild(routes),CommonModule,FormsModule]
})
export class EmployeeModule{

}