import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  console.log('🔐 Auth Interceptor - URL:', req.url);
  console.log('🔐 Auth Interceptor - Token exists:', !!token);
  
  if (token) {
    console.log('✅ Adding Authorization header to request');
    // Clone the request and add authorization header
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq);
  } else {
    console.log('❌ No token found, request sent without authorization');
  }
  
  return next(req);
};

// Keep the old class-based interceptor for backward compatibility
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    console.log('🔐 Auth Interceptor - URL:', req.url);
    console.log('🔐 Auth Interceptor - Token exists:', !!token);
    
    if (token) {
      console.log('✅ Adding Authorization header to request');
      // Clone the request and add authorization header
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(authReq);
    } else {
      console.log('❌ No token found, request sent without authorization');
    }
    
    return next.handle(req);
  }
}
