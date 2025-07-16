import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AdminComponent } from "./admin-component/admin-component";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

// Optimized routes with preloading strategy for performance
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
                loadComponent: () => import('./employees-list/employees-list').then(m => m.EmployeesList),
                data: { preload: true } // High priority preload
            },
            {
                path: 'monthly-view',
                loadComponent: () => import('./monthly-view/monthly-view').then(m => m.MonthlyView),
                data: { preload: false } // Lazy load on demand
            },
            {
                path: 'create-employee',
                loadComponent: () => import('./create-employee/create-employee').then(m => m.CreateEmployee),
                data: { preload: false }
            },
            {
                path: 'employee-details/:id',
                loadComponent: () => import('./view-employee/view-employee').then(m => m.ViewEmployee),
                data: { preload: true } // Commonly accessed
            },
            {
                path: 'edit-employee/:id',
                loadComponent: () => import('./edit-employee-component/edit-employee-component').then(m => m.EditEmployeeComponent),
                data: { preload: false }
            },
            {
                path: 'generate-payslip/:id',
                loadComponent: () => import('./generate-payslip/generate-payslip').then(m => m.GeneratePayslipComponent),
                data: { preload: false } // Heavy component, load only when needed
            }
        ]
    }
];

@NgModule({
    declarations: [],
    imports: [
        RouterModule.forChild(routes), 
        FormsModule, 
        CommonModule
    ]
})
export class AdminModule { // Fixed typo: AdimModule -> AdminModule

}