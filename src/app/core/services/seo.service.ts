import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  canonical?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly defaultSEO = environment.seo;

  constructor(
    private titleService: Title,
    private metaService: Meta
  ) {}

  /**
   * Update page title and meta tags
   */
  updateSEO(seoData: SEOData): void {
    // Update title
    if (seoData.title) {
      this.titleService.setTitle(seoData.title);
    }

    // Update meta description
    if (seoData.description) {
      this.metaService.updateTag({ name: 'description', content: seoData.description });
    }

    // Update keywords
    if (seoData.keywords) {
      this.metaService.updateTag({ name: 'keywords', content: seoData.keywords });
    }

    // Update Open Graph tags
    if (seoData.ogTitle) {
      this.metaService.updateTag({ property: 'og:title', content: seoData.ogTitle });
    }
    if (seoData.ogDescription) {
      this.metaService.updateTag({ property: 'og:description', content: seoData.ogDescription });
    }
    if (seoData.ogImage) {
      this.metaService.updateTag({ property: 'og:image', content: seoData.ogImage });
    }

    // Update Twitter tags
    if (seoData.twitterTitle) {
      this.metaService.updateTag({ property: 'twitter:title', content: seoData.twitterTitle });
    }
    if (seoData.twitterDescription) {
      this.metaService.updateTag({ property: 'twitter:description', content: seoData.twitterDescription });
    }

    // Update canonical URL
    if (seoData.canonical) {
      this.updateCanonical(seoData.canonical);
    }
  }

  /**
   * Set page title with app name suffix
   */
  setPageTitle(pageTitle: string): void {
    const fullTitle = `${pageTitle} | ${environment.appName}`;
    this.titleService.setTitle(fullTitle);
    this.metaService.updateTag({ property: 'og:title', content: fullTitle });
    this.metaService.updateTag({ property: 'twitter:title', content: fullTitle });
  }

  /**
   * Reset to default SEO settings
   */
  resetToDefault(): void {
    this.updateSEO({
      title: this.defaultSEO.title,
      description: this.defaultSEO.description,
      keywords: this.defaultSEO.keywords,
      ogTitle: this.defaultSEO.title,
      ogDescription: this.defaultSEO.description,
      ogImage: this.defaultSEO.ogImage,
      twitterTitle: this.defaultSEO.title,
      twitterDescription: this.defaultSEO.description
    });
  }

  /**
   * Update canonical URL
   */
  private updateCanonical(url: string): void {
    // Remove existing canonical link
    const existingCanonical = document.querySelector("link[rel='canonical']");
    if (existingCanonical) {
      existingCanonical.remove();
    }

    // Add new canonical link
    const link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    document.head.appendChild(link);
  }

  /**
   * Get current page title
   */
  getCurrentTitle(): string {
    return this.titleService.getTitle();
  }

  /**
   * Update meta tags for specific pages
   */
  updatePageSEO(pageType: 'login' | 'dashboard' | 'employee' | 'admin' | 'timesheet'): void {
    const baseTitle = environment.appName;
    
    switch (pageType) {
      case 'login':
        this.updateSEO({
          title: `Login | ${baseTitle}`,
          description: 'Secure login to Willware Timesheet system. Access your employee dashboard and manage your attendance records.',
          ogTitle: `Login | ${baseTitle}`,
          ogDescription: 'Secure login to Willware Timesheet system. Access your employee dashboard and manage your attendance records.'
        });
        break;

      case 'dashboard':
        this.updateSEO({
          title: `Dashboard | ${baseTitle}`,
          description: 'Employee dashboard for timesheet management. View attendance, check-in/out, and track working hours.',
          ogTitle: `Dashboard | ${baseTitle}`,
          ogDescription: 'Employee dashboard for timesheet management. View attendance, check-in/out, and track working hours.'
        });
        break;

      case 'employee':
        this.updateSEO({
          title: `Employee Portal | ${baseTitle}`,
          description: 'Employee portal for attendance tracking and timesheet management. Check-in, check-out, and view work history.',
          ogTitle: `Employee Portal | ${baseTitle}`,
          ogDescription: 'Employee portal for attendance tracking and timesheet management. Check-in, check-out, and view work history.'
        });
        break;

      case 'admin':
        this.updateSEO({
          title: `Admin Panel | ${baseTitle}`,
          description: 'Administrator panel for employee management and attendance oversight. Manage employees, view reports, and system administration.',
          ogTitle: `Admin Panel | ${baseTitle}`,
          ogDescription: 'Administrator panel for employee management and attendance oversight. Manage employees, view reports, and system administration.'
        });
        break;

      case 'timesheet':
        this.updateSEO({
          title: `Timesheet Management | ${baseTitle}`,
          description: 'Comprehensive timesheet management system. Track employee hours, generate reports, and manage attendance records.',
          ogTitle: `Timesheet Management | ${baseTitle}`,
          ogDescription: 'Comprehensive timesheet management system. Track employee hours, generate reports, and manage attendance records.'
        });
        break;

      default:
        this.resetToDefault();
    }
  }
}
