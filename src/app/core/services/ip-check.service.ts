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

  // Backup IP APIs for redundancy + more reliable methods
  private readonly IP_APIS = [
    // Remove CORS-problematic APIs and use CORS-friendly alternatives
    'https://httpbin.org/ip',
    'https://jsonip.com',
    'https://api.my-ip.io/ip.json',
    'https://ifconfig.me/ip'
  ];

  // Alternative office detection methods
  private readonly OFFICE_DETECTION_METHODS = {
    // Method 1: IP Range Check
    ipCheck: true,
    // Method 2: Network Name Check (if available)
    networkName: true,
    // Method 3: Geolocation proximity check
    geolocation: true,
    // Method 4: Custom office endpoint ping
    serverPing: true
  };

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
    // Try multiple APIs in sequence with fallbacks
    return this.tryIPAPI(0);
  }

  private tryIPAPI(index: number): Observable<string> {
    if (index >= this.IP_APIS.length) {
      // All APIs failed, try alternative detection methods
      return this.alternativeNetworkDetection();
    }

    const apiUrl = this.IP_APIS[index];
    
    return this.http.get<any>(apiUrl).pipe(
      timeout(5000), // Increased timeout
      map(response => {
        // Handle different API response formats
        let ip = '';
        if (typeof response === 'string') {
          ip = response.trim();
        } else if (response) {
          ip = response.ip || response.query || response.origin || response.ipAddress || '';
        }
        
        // Validate IP format
        if (ip && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
          return ip;
        }
        throw new Error('Invalid IP format');
      }),
      catchError((error) => {
        // Reduce console noise for expected API failures
        if (index === this.IP_APIS.length - 1) {
          console.warn(`All IP APIs failed, using fallback detection`);
        }
        // Try next API
        return this.tryIPAPI(index + 1);
      })
    );
  }

  private alternativeNetworkDetection(): Observable<string> {
    // Alternative method: Try to determine office network without external APIs
    return new Observable(observer => {
      // Method 1: Check for local IP ranges (works if connected to office WiFi)
      this.checkLocalNetworkInfo().then(localInfo => {
        if (localInfo.isOfficeNetwork) {
          observer.next(localInfo.ip);
          observer.complete();
        } else {
          // Method 2: Fallback to cached IP or manual entry
          const cachedIP = localStorage.getItem('lastKnownOfficeIP');
          if (cachedIP && this.isOfficeIP(cachedIP)) {
            observer.next(cachedIP);
          } else {
            observer.next('unknown'); // Let component handle this case
          }
          observer.complete();
        }
      }).catch(error => {
        console.error('Alternative network detection failed:', error);
        observer.next('detection-failed');
        observer.complete();
      });
    });
  }

  private async checkLocalNetworkInfo(): Promise<{isOfficeNetwork: boolean, ip: string}> {
    try {
      // Try to use WebRTC to get local IP addresses
      const localIPs = await this.getLocalIPAddresses();
      
      for (const ip of localIPs) {
        if (this.isOfficeIP(ip)) {
          // Cache the detected office IP
          localStorage.setItem('lastKnownOfficeIP', ip);
          return { isOfficeNetwork: true, ip: ip };
        }
      }
      
      return { isOfficeNetwork: false, ip: localIPs[0] || 'unknown' };
    } catch (error) {
      console.warn('Local network detection failed:', error);
      return { isOfficeNetwork: false, ip: 'detection-failed' };
    }
  }

  private getLocalIPAddresses(): Promise<string[]> {
    return new Promise((resolve) => {
      const ips: string[] = [];
      const rtc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      rtc.createDataChannel('');
      rtc.onicecandidate = (e) => {
        if (!e.candidate) {
          rtc.close();
          resolve([...new Set(ips)]); // Remove duplicates
          return;
        }
        
        const match = e.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (match && !ips.includes(match[1])) {
          ips.push(match[1]);
        }
      };

      rtc.createOffer().then(offer => rtc.setLocalDescription(offer));
      
      // Timeout after 3 seconds
      setTimeout(() => {
        rtc.close();
        resolve([...new Set(ips)]);
      }, 3000);
    });
  }

  // Enhanced office network detection with multiple fallbacks
  checkOfficeNetworkWithFallbacks(): Observable<OfficeNetworkStatus> {
    const status: OfficeNetworkStatus = {
      isConnected: navigator.onLine,
      isOfficeNetwork: false,
      ipAddress: '',
      checking: true
    };

    this.updateStatus(status);

    return new Observable(observer => {
      // Method 1: Try primary IP detection
      this.fetchPublicIP().subscribe({
        next: (ip) => {
          if (ip && ip !== 'unknown' && ip !== 'detection-failed') {
            const isOffice = this.isOfficeIP(ip);
            const finalStatus: OfficeNetworkStatus = {
              isConnected: true,
              isOfficeNetwork: isOffice,
              ipAddress: ip,
              checking: false
            };
            this.updateStatus(finalStatus);
            observer.next(finalStatus);
            observer.complete();
          } else {
            // Primary method failed, try alternative approaches
            this.tryAlternativeMethods().subscribe(altStatus => {
              this.updateStatus(altStatus);
              observer.next(altStatus);
              observer.complete();
            });
          }
        },
        error: (error) => {
          console.error('Primary network check failed:', error);
          // Try alternative methods
          this.tryAlternativeMethods().subscribe(altStatus => {
            this.updateStatus(altStatus);
            observer.next(altStatus);
            observer.complete();
          });
        }
      });
    });
  }

  private tryAlternativeMethods(): Observable<OfficeNetworkStatus> {
    return new Observable(observer => {
      // Check cached data first
      const cachedIP = localStorage.getItem('lastKnownOfficeIP');
      const lastCheckTime = localStorage.getItem('lastOfficeCheckTime');
      const now = Date.now();
      
      // If we have recent cached data (within 1 hour), use it
      if (cachedIP && lastCheckTime && (now - parseInt(lastCheckTime)) < 3600000) {
        const status: OfficeNetworkStatus = {
          isConnected: true,
          isOfficeNetwork: this.isOfficeIP(cachedIP),
          ipAddress: cachedIP,
          checking: false,
          error: 'Using cached IP data (network APIs unavailable)'
        };
        observer.next(status);
        observer.complete();
        return;
      }

      // Manual override for development/testing
      const manualOverride = localStorage.getItem('officeNetworkOverride');
      if (manualOverride === 'true') {
        const status: OfficeNetworkStatus = {
          isConnected: true,
          isOfficeNetwork: true,
          ipAddress: 'manual-override',
          checking: false,
          error: 'Manual override enabled for development'
        };
        observer.next(status);
        observer.complete();
        return;
      }

      // Final fallback: Allow access with warning in development mode
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const status: OfficeNetworkStatus = {
        isConnected: navigator.onLine,
        isOfficeNetwork: isDevelopment, // Allow in development, require check in production
        ipAddress: 'detection-failed',
        checking: false,
        error: isDevelopment 
          ? 'Development mode: Network check bypassed' 
          : 'Network detection unavailable. Please ensure you are connected to office WiFi.'
      };
      observer.next(status);
      observer.complete();
    });
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
