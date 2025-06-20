import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AdminComponent } from "./admin-component/admin-component";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

const routes:Routes =[
    {path:'',component:AdminComponent}
]
@NgModule({
    declarations:[],
    imports:[RouterModule.forChild(routes),FormsModule,CommonModule]
})
export class AdimModule{

}