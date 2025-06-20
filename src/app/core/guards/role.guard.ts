import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, GuardResult, MaybeAsync, Route, Router, RouterStateSnapshot } from "@angular/router";
import { TokenClass } from "typescript";
import { Authservice } from "../services/auth.service";

@Injectable({providedIn:'root'})

export class RoleGuard implements CanActivate{
    constructor(private Authservice:Authservice, private router:Router){

    }
    canActivate(route:ActivatedRouteSnapshot):boolean {
        const expectedRole = route.data['role'];
        if(this.Authservice.getuserrole() === expectedRole) return true;
        this.router.navigate(['auth/login'])
        return false
    }
}