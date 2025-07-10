import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { Logincomponent } from "./logincomponent/logincomponent";
import { CommonModule } from "@angular/common";

const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: Logincomponent }
]

@NgModule({
    declarations: [],
    imports: [
        RouterModule.forChild(routes),
        CommonModule,
        Logincomponent // Import standalone component
    ]
})
export class AuthModule {}