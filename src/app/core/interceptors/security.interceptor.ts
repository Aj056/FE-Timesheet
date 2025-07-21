import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class SecurityInterceptor implements HttpInterceptor {
  
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Clone the request to add security headers
    let secureReq = req.clone();

    // Add JWT token for protected routes
    const token = this.authService.getToken();
    if (token && this.isProtectedRoute(req.url)) {
      secureReq = secureReq.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`
        }
      });
    }

    // Add basic security headers
    secureReq = secureReq.clone({
      setHeaders: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    return next.handle(secureReq).pipe(
      timeout(30000), // 30 second timeout
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          // Token expired or invalid, logout user
          console.warn('Authentication failed, logging out user');
          this.authService.logout();
        }
        return throwError(() => error);
      })
    );
  }

  private isProtectedRoute(url: string): boolean {
    // Routes that require authentication
    const protectedRoutes = ['/all', '/allemp'];
    return protectedRoutes.some(route => url.includes(route));
  }
}
