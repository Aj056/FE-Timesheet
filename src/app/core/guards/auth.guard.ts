import { Injectable } from "@angular/core";
import { CanActivate,Router, } from "@angular/router";
import { Authservice } from "../services/auth.service";

@Injectable({providedIn:'root'})
export class AuthGuard implements CanActivate{
    constructor(private authservice:Authservice , private router:Router){

    }
    canActivate():boolean{
        if(this.authservice.isLoggedIN()) return true;
        this.router.navigate(['auth/login']);
        return false;
    }
}