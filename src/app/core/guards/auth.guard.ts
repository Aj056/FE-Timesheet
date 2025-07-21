import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

@Injectable({providedIn:'root'})
export class AuthGuard implements CanActivate {
    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    canActivate(): boolean {
        if (this.authService.isLoggedIN()) {
            return true;
        }
        
        // Clear any stale session data
        localStorage.clear();
        this.router.navigate(['auth/login']);
        return false;
    }
}