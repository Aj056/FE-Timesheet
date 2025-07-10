import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('🚨 HTTP Error Interceptor:', error);
      
      if (error.status === 401) {
        console.log('🔐 401 Unauthorized - Token may be invalid or expired');
        // Clear token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        router.navigate(['/auth/login']);
      }
      
      return throwError(() => error);
    })
  );
};

import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ToastService } from '../services/toast.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private toastService: ToastService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('🚨 HTTP Error Interceptor:', error);

        let errorMessage = 'An unknown error occurred';

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Server-side error
          switch (error.status) {
            case 401:
              console.log('🔐 401 Unauthorized - Token may be invalid or expired');
              // Clear token and redirect to login
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('role');
              localStorage.removeItem('userId');
              this.router.navigate(['/auth/login']);
              errorMessage = 'Session expired. Please login again.';
              break;
            case 403:
              errorMessage = 'You do not have permission to access this resource.';
              break;
            case 404:
              errorMessage = 'The requested resource was not found.';
              break;
            case 500:
              errorMessage = 'Internal server error. Please try again later.';
              break;
            default:
              errorMessage = error.error?.message || `Error Code: ${error.status}`;
          }
        }

        // Show error toast notification
        this.toastService.error({
          title: 'Error',
          message: errorMessage,
          duration: 5000
        });

        return throwError(() => error);
      })
    );
  }
}
