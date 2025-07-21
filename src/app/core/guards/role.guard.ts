import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

@Injectable({providedIn:'root'})
export class RoleGuard implements CanActivate {
    constructor(
        private authservice: AuthService,
        private router: Router
    ) {}

    canActivate(route: ActivatedRouteSnapshot): boolean {
        const expectedRole = route.data['role'];
        const currentRole = this.authservice.getUserRole();
        
        if (currentRole === expectedRole) {
            console.log(`✅ Role access granted. Expected: ${expectedRole}, Current: ${currentRole}`);
            return true;
        }
        
        // Access denied
        console.warn(`❌ Access denied. Expected role: ${expectedRole}, Current role: ${currentRole}`);
        this.router.navigate(['auth/login']);
        return false;
    }
}