import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AdminComponent } from "./admin-component/admin-component";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
const routes: Routes = [
    {
        path: '',
        redirectTo: 'employees',
        pathMatch: 'full'
    },
    {
        path: '',
        component: AdminComponent,
        children: [
            {
                path: 'employees',
                loadComponent: () => import('./employees-list/employees-list').then(m => m.EmployeesList)
            },
            {
                path: 'monthly-view',
                loadComponent: () => import('./monthly-view/monthly-view').then(m => m.MonthlyView)
            }
            
        ]
    }
];
@NgModule({
    declarations: [],
    imports: [RouterModule.forChild(routes), FormsModule, CommonModule]
})
export class AdimModule {

}