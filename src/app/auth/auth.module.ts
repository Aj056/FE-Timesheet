import { NgModule } from "@angular/core";
import { Route, RouterModule, Routes } from "@angular/router";
import { Logincomponent } from "./logincomponent/logincomponent";
import { CommonModule } from "@angular/common";



const routes:Routes = [
    {path:'login',component:Logincomponent}
]

@NgModule({
    declarations:[],
    imports:[RouterModule.forChild(routes),CommonModule]
})
export class AuthModule{}