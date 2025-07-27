import { ApplicationConfig, provideZonelessChangeDetection, ErrorHandler } from '@angular/core';
import { provideRouter, withPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { GlobalErrorHandlerService } from './core/services/global-error-handler.service';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { CustomPreloadingStrategy } from './core/strategies/custom-preloading.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(
      routes, 
      withPreloading(CustomPreloadingStrategy) // Add custom preloading strategy
    ),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    
    // Performance optimization providers
    CustomPreloadingStrategy,
    
    // Global Error Handler
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandlerService,
    }
  ]
};
