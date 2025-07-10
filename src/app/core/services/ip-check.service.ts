import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

export interface OfficeNetworkStatus {
  isConnected: boolean;
  isOfficeNetwork: boolean;
  ipAddress: string;
  checking: boolean;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class IpCheckService {
  // Signals for reactive updates
  publicIP = signal<string>(''); 
  isOfficeNetwork = signal<boolean | null>(null); // null = checking
  
  // BehaviorSubject for broader compatibility  
  private networkStatusSubject = new BehaviorSubject<OfficeNetworkStatus>({
    isConnected: navigator.onLine,
    isOfficeNetwork: false,
    ipAddress: '',
    checking: false
  });
  
  public networkStatus$ = this.networkStatusSubject.asObservable();

  // Production office IP patterns - DO NOT MODIFY WITHOUT APPROVAL
  private readonly officeIPPatterns = [
    '49.37.',        // Primary office network
    '49.37.212.' ,
    '49.37.210.225',
    '2405:201:e01c:21e7:ac18:5c2:c6d7:e05f'    // Specific office IP
  ];

  // Backup IP APIs for redundancy
  private readonly IP_APIS = [
    'https://api.ipify.org?format=json',
    'https://api64.ipify.org?format=json',
    'https://ipapi.co/json/'
  ];

  constructor(private http: HttpClient) {
    this.initializeNetworkMonitoring();
    this.checkOfficeNetwork();
  }

  private initializeNetworkMonitoring(): void {
    // Listen for network changes
    window.addEventListener('online', () => {
      this.checkOfficeNetwork();
    });
    
    window.addEventListener('offline', () => {
      this.updateStatus({
        isConnected: false,
        isOfficeNetwork: false,
        ipAddress: '',
        checking: false,
        error: 'No internet connection'
      });
    });
  }

  /**
   * Check if connected to office network
   * Critical for attendance functionality - DO NOT MODIFY
   */
  public checkOfficeNetwork(): Observable<OfficeNetworkStatus> {
    if (!navigator.onLine) {
      const status: OfficeNetworkStatus = {
        isConnected: false,
        isOfficeNetwork: false,
        ipAddress: '',
        checking: false,
        error: 'No internet connection'
      };
      this.updateStatus(status);
      return new BehaviorSubject(status).asObservable();
    }

    this.updateStatus({ ...this.getCurrentStatus(), checking: true });

    return this.fetchPublicIP().pipe(
      map(ipAddress => {
        const isOffice = this.isOfficeIP(ipAddress);
        const status: OfficeNetworkStatus = {
          isConnected: true,
          isOfficeNetwork: isOffice,
          ipAddress,
          checking: false
        };
        
        this.updateStatus(status);
        return status;
      }),
      catchError(error => {
        const status: OfficeNetworkStatus = {
          isConnected: true,
          isOfficeNetwork: false,
          ipAddress: '',
          checking: false,
          error: 'Failed to check office network'
        };
        this.updateStatus(status);
        return new BehaviorSubject(status).asObservable();
      })
    );
  }

  private fetchPublicIP(): Observable<string> {
    // Try primary API first
    return this.http.get<{ ip: string }>(this.IP_APIS[0])
      .pipe(
        timeout(5000),
        map(response => response.ip),
        catchError(() => {
          // Try backup API
          return this.http.get<{ ip: string }>(this.IP_APIS[1])
            .pipe(
              timeout(3000),
              map(response => response.ip),
              catchError(() => {
                // Try third API with different format
                return this.http.get<any>(this.IP_APIS[2])
                  .pipe(
                    timeout(3000),
                    map(response => response.ip || response.query || '')
                  );
              })
            );
        })
      );
  }

  private isOfficeIP(ip: string): boolean {
    if (!ip) return false;
    return this.officeIPPatterns.some(pattern => ip.startsWith(pattern));
  }

  private updateStatus(status: OfficeNetworkStatus): void {
    this.publicIP.set(status.ipAddress);
    this.isOfficeNetwork.set(status.isOfficeNetwork);
    this.networkStatusSubject.next(status);
  }

  private getCurrentStatus(): OfficeNetworkStatus {
    return this.networkStatusSubject.value;
  }

  // Public methods for component use
  public getCurrentIP(): string {
    return this.publicIP();
  }

  public isConnectedToOffice(): boolean {
    return this.isOfficeNetwork() === true;
  }

  public isChecking(): boolean {
    return this.getCurrentStatus().checking;
  }

  public forceRefresh(): Observable<OfficeNetworkStatus> {
    return this.checkOfficeNetwork();
  }

  public getStatusMessage(): string {
    const status = this.getCurrentStatus();
    
    if (status.checking) {
      return 'Checking office network...';
    }
    
    if (!status.isConnected) {
      return 'No internet connection';
    }
    
    if (status.isOfficeNetwork) {
      return 'Connected to office network';
    }
    
    return 'Not connected to office network';
  }
}
