import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkThemeSubject = new BehaviorSubject<boolean>(false);
  public isDarkTheme$ = this.isDarkThemeSubject.asObservable();

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    const isDarkTheme = savedTheme ? savedTheme === 'dark' : false; // Default to light theme
    
    this.isDarkThemeSubject.next(isDarkTheme);
    this.applyTheme(isDarkTheme);
  }

  public toggleTheme(): void {
    const currentTheme = this.isDarkThemeSubject.value;
    const newTheme = !currentTheme;
    
    this.isDarkThemeSubject.next(newTheme);
    this.applyTheme(newTheme);
    this.saveThemePreference(newTheme);
  }

  public setTheme(isDarkTheme: boolean): void {
    this.isDarkThemeSubject.next(isDarkTheme);
    this.applyTheme(isDarkTheme);
    this.saveThemePreference(isDarkTheme);
  }

  public getCurrentTheme(): boolean {
    return this.isDarkThemeSubject.value;
  }

  private applyTheme(isDarkTheme: boolean): void {
    const body = document.body;
    const html = document.documentElement;
    
    if (isDarkTheme) {
      body.classList.remove('light-theme');
      body.classList.add('dark-theme');
      html.setAttribute('data-theme', 'dark');
    } else {
      body.classList.remove('dark-theme');
      body.classList.add('light-theme');
      html.setAttribute('data-theme', 'light');
    }
  }

  private saveThemePreference(isDarkTheme: boolean): void {
    const theme = isDarkTheme ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
  }
}
