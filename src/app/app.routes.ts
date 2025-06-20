import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { RedirectComponent } from './core/guards/rediectcomponent';

export const routes: Routes = [
   {path:'', redirectTo:'redirect', pathMatch:'full'},
   {
    path:'redirect',
    canActivate:[AuthGuard],
    component:RedirectComponent
   },
   {
    path:'auth',
    loadChildren:()=>import('./auth/auth.module').then(m => m.AuthModule)
   },
   {
      path:'admin',
      loadChildren:()=>import('./admin/Adminmodule').then(m => m.AdimModule),
      canActivate:[AuthGuard,RoleGuard],
      data:{role:'admin'}
   },
   {
      path:'employee',
      loadChildren:()=>import('./employee/EmployeeModule').then(m => m.EmployeeModule),
      canActivate:[AuthGuard,RoleGuard],
      data:{role:'employee'}
   },
   {
      path:'**',
      redirectTo:'redirect'
   }
   
];


@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
  })
  export class AppRoutingModule {}
