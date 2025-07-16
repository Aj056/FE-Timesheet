import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CustomPreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Only preload routes marked with preload: true
    if (route.data && route.data['preload']) {
      console.log('Preloading route:', route.path);
      // Add a small delay to not block the initial render
      return of(true).pipe(
        delay(100),
        switchMap(() => load())
      );
    }
    
    return of(null);
  }
}
