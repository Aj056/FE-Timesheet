import { Component, OnInit, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { PopupService } from '../../../core/services/popup.service';

@Component({
  selector: 'app-network-diagnostics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="network-diagnostics">
      <h2>🌐 Network Diagnostics Tool</h2>
      <p>This tool helps diagnose office WiFi and network connectivity issues.</p>
      
      <!-- Current Status -->
      <div class="status-section">
        <h3>📊 Current Network Status</h3>
        <div class="status-grid">
          <div class="status-item" [ngClass]="'status-' + (navigator.onLine ? 'online' : 'offline')">
            <div class="status-icon">{{ navigator.onLine ? '🟢' : '🔴' }}</div>
            <div class="status-label">Internet Connection</div>
            <div class="status-value">{{ navigator.onLine ? 'Connected' : 'Disconnected' }}</div>
          </div>
          
          <div class="status-item">
            <div class="status-icon">📡</div>
            <div class="status-label">Connection Type</div>
            <div class="status-value">{{ getConnectionType() }}</div>
          </div>
          
          <div class="status-item">
            <div class="status-icon">⚡</div>
            <div class="status-label">Network Speed</div>
            <div class="status-value">{{ getNetworkSpeed() }}</div>
          </div>
        </div>
      </div>

      <!-- Quick Tests -->
      <div class="tests-section">
        <h3>🔍 Quick Network Tests</h3>
        <div class="test-buttons">
          <button class="test-btn primary" (click)="runFullDiagnostics()" [disabled]="isRunningTest()">
            {{ isRunningTest() ? '🔄 Running Tests...' : '🚀 Run Full Diagnostics' }}
          </button>
          <button class="test-btn secondary" (click)="testBasicConnectivity()">
            🌐 Test Basic Connectivity
          </button>
          <button class="test-btn secondary" (click)="testOfficeServers()">
            🏢 Test Office Servers
          </button>
          <button class="test-btn secondary" (click)="showDetailedInfo()">
            📋 Show Detailed Info
          </button>
        </div>
      </div>

      <!-- Common Issues -->
      <div class="help-section">
        <h3>❓ Common Office WiFi Issues</h3>
        <div class="issue-list">
          <div class="issue-item" (click)="showSolution('firewall')">
            <div class="issue-icon">🔥</div>
            <div class="issue-text">Firewall blocking websites</div>
            <div class="issue-arrow">→</div>
          </div>
          <div class="issue-item" (click)="showSolution('proxy')">
            <div class="issue-icon">🔀</div>
            <div class="issue-text">Proxy configuration issues</div>
            <div class="issue-arrow">→</div>
          </div>
          <div class="issue-item" (click)="showSolution('dns')">
            <div class="issue-icon">🏷️</div>
            <div class="issue-text">DNS resolution problems</div>
            <div class="issue-arrow">→</div>
          </div>
          <div class="issue-item" (click)="showSolution('bandwidth')">
            <div class="issue-icon">📊</div>
            <div class="issue-text">Slow connection/bandwidth limits</div>
            <div class="issue-arrow">→</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./network-diagnostics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NetworkDiagnosticsComponent implements OnInit {
  isRunningTest = signal(false);
  navigator = navigator; // Make navigator available in template

  constructor(
    private toast: ToastService,
    private popup: PopupService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Monitor network changes
    window.addEventListener('online', () => {
      this.toast.success('Internet connection restored');
      this.cdr.markForCheck();
    });
    
    window.addEventListener('offline', () => {
      this.toast.error('Internet connection lost');
      this.cdr.markForCheck();
    });
  }

  getConnectionType(): string {
    const nav = navigator as any;
    if (nav.connection) {
      return nav.connection.effectiveType || nav.connection.type || 'Unknown';
    }
    return 'Unknown';
  }

  getNetworkSpeed(): string {
    const nav = navigator as any;
    if (nav.connection && nav.connection.downlink) {
      return `${nav.connection.downlink} Mbps`;
    }
    return 'Unknown';
  }

  async runFullDiagnostics(): Promise<void> {
    if (this.isRunningTest()) return;
    
    this.isRunningTest.set(true);
    this.cdr.markForCheck();

    const loadingId = this.popup.loading({
      title: 'Running Full Network Diagnostics',
      message: 'Testing multiple endpoints and network conditions...'
    });

    try {
      const tests = [
        this.testEndpoint('Google Public DNS', 'https://dns.google'),
        this.testEndpoint('Cloudflare DNS', 'https://1.1.1.1'),
        this.testEndpoint('Local Backend', 'http://localhost:3000'),
        this.testEndpoint('Public API Test', 'https://httpbin.org/get'),
        this.testEndpoint('Speed Test', 'https://www.google.com'),
      ];

      const results = await Promise.allSettled(tests);
      this.showDiagnosticResults(results);
      
    } finally {
      this.isRunningTest.set(false);
      this.popup.close('close', undefined, loadingId);
      this.cdr.markForCheck();
    }
  }

  async testBasicConnectivity(): Promise<void> {
    const loadingId = this.popup.loading({
      title: 'Testing Basic Connectivity',
      message: 'Checking internet access...'
    });

    try {
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD', 
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000)
      });
      
      this.toast.success('Basic connectivity test passed!');
    } catch (error) {
      this.toast.error('Basic connectivity test failed. Check your internet connection.');
    } finally {
      this.popup.close('close', undefined, loadingId);
    }
  }

  async testOfficeServers(): Promise<void> {
    const loadingId = this.popup.loading({
      title: 'Testing Office Servers',
      message: 'Checking office network access...'
    });

    try {
      // Test common office endpoints
      const tests = [
        this.testEndpoint('Local Backend', 'http://localhost:3000'),
        this.testEndpoint('Internal Network', window.location.origin),
        this.testEndpoint('Office Gateway', 'http://192.168.1.1'), // Common gateway
      ];

      const results = await Promise.allSettled(tests);
      this.showOfficeTestResults(results);
      
    } finally {
      this.popup.close('close', undefined, loadingId);
    }
  }

  private async testEndpoint(name: string, url: string): Promise<{name: string, success: boolean, error?: string, time?: number}> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        signal: AbortSignal.timeout(10000)
      });
      
      const time = Date.now() - startTime;
      return { name, success: true, time };
    } catch (error: any) {
      const time = Date.now() - startTime;
      return { name, success: false, error: error.message, time };
    }
  }

  private showDiagnosticResults(results: PromiseSettledResult<any>[]): void {
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const total = results.length;
    const successRate = Math.round((successful / total) * 100);

    let diagnosis = '';
    if (successRate >= 80) {
      diagnosis = '🟢 Excellent - Network is working well';
    } else if (successRate >= 60) {
      diagnosis = '🟡 Good - Minor connectivity issues detected';
    } else if (successRate >= 40) {
      diagnosis = '🟠 Fair - Significant connectivity problems';
    } else {
      diagnosis = '🔴 Poor - Major network issues detected';
    }

    const resultsHtml = `
      <div class="diagnostic-results">
        <h4>${diagnosis}</h4>
        <p><strong>Success Rate:</strong> ${successRate}% (${successful}/${total} tests passed)</p>
        <h5>📋 Detailed Results:</h5>
        <ul>
          ${results.map((result, index) => {
            if (result.status === 'fulfilled') {
              const test = result.value;
              const status = test.success ? '✅' : '❌';
              const time = test.time ? ` (${test.time}ms)` : '';
              return `<li>${status} ${test.name}${time}</li>`;
            }
            return `<li>❌ Test ${index + 1}: Failed</li>`;
          }).join('')}
        </ul>
        ${this.getRecommendations(successRate)}
      </div>
    `;

    this.popup.custom({
      title: 'Network Diagnostic Results',
      html: resultsHtml,
      width: '600px',
      buttons: [
        {
          label: 'Run Again',
          action: () => {
            this.popup.closeAll();
            setTimeout(() => this.runFullDiagnostics(), 500);
          },
          style: 'secondary'
        },
        {
          label: 'Close',
          action: () => this.popup.closeAll(),
          style: 'primary'
        }
      ]
    });
  }

  private showOfficeTestResults(results: PromiseSettledResult<any>[]): void {
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    
    let message = '';
    if (successful === 0) {
      message = '🔴 No office servers accessible. Check your office network connection.';
    } else if (successful === results.length) {
      message = '🟢 All office servers accessible. Office network is working well.';
    } else {
      message = '🟡 Some office servers accessible. There may be network restrictions.';
    }

    this.toast.info(message);
  }

  private getRecommendations(successRate: number): string {
    if (successRate >= 80) {
      return '<p><strong>💡 Recommendations:</strong> Your network is working well. If you are still experiencing issues, they may be application-specific.</p>';
    } else if (successRate >= 40) {
      return '<p><strong>💡 Recommendations:</strong> Check firewall settings, proxy configuration, or contact your IT department.</p>';
    } else {
      return '<p><strong>💡 Recommendations:</strong> Major connectivity issues detected. Check WiFi connection, restart network adapter, or contact IT support immediately.</p>';
    }
  }

  showDetailedInfo(): void {
    const nav = navigator as any;
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      onLine: navigator.onLine,
      connection: nav.connection ? {
        effectiveType: nav.connection.effectiveType,
        downlink: nav.connection.downlink,
        rtt: nav.connection.rtt,
        type: nav.connection.type
      } : null
    };

    const infoHtml = `
      <div class="detailed-info">
        <h4>🔍 Detailed Network Information</h4>
        <table>
          <tr><td><strong>Online Status:</strong></td><td>${info.onLine ? '🟢 Online' : '🔴 Offline'}</td></tr>
          <tr><td><strong>Platform:</strong></td><td>${info.platform}</td></tr>
          <tr><td><strong>Language:</strong></td><td>${info.language}</td></tr>
          ${info.connection ? `
            <tr><td><strong>Connection Type:</strong></td><td>${info.connection.effectiveType || 'Unknown'}</td></tr>
            <tr><td><strong>Downlink Speed:</strong></td><td>${info.connection.downlink || 'Unknown'} Mbps</td></tr>
            <tr><td><strong>Round Trip Time:</strong></td><td>${info.connection.rtt || 'Unknown'} ms</td></tr>
          ` : ''}
          <tr><td><strong>User Agent:</strong></td><td style="font-size: 0.8em; word-break: break-all;">${info.userAgent}</td></tr>
        </table>
      </div>
    `;

    this.popup.custom({
      title: 'Detailed Network Information',
      html: infoHtml,
      width: '600px',
      buttons: [
        {
          label: 'Copy to Clipboard',
          action: () => {
            navigator.clipboard.writeText(JSON.stringify(info, null, 2));
            this.toast.success('Network info copied to clipboard');
          },
          style: 'secondary'
        },
        {
          label: 'Close',
          action: () => this.popup.closeAll(),
          style: 'primary'
        }
      ]
    });
  }

  showSolution(issueType: string): void {
    const solutions: Record<string, {title: string, content: string}> = {
      firewall: {
        title: '🔥 Firewall Issues',
        content: `
          <h5>Common Symptoms:</h5>
          <ul>
            <li>Specific websites are blocked</li>
            <li>Some applications don't work</li>
            <li>Downloads are blocked</li>
          </ul>
          <h5>Solutions:</h5>
          <ul>
            <li>Contact IT to whitelist required domains</li>
            <li>Use company VPN if available</li>
            <li>Try accessing via HTTPS instead of HTTP</li>
            <li>Check if there's a company proxy to configure</li>
          </ul>
        `
      },
      proxy: {
        title: '🔀 Proxy Configuration',
        content: `
          <h5>Common Symptoms:</h5>
          <ul>
            <li>Browser shows proxy authentication errors</li>
            <li>Some sites load, others don't</li>
            <li>Connection timeout errors</li>
          </ul>
          <h5>Solutions:</h5>
          <ul>
            <li>Check browser proxy settings</li>
            <li>Get proxy details from IT department</li>
            <li>Configure proxy authentication</li>
            <li>Try disabling proxy temporarily for testing</li>
          </ul>
        `
      },
      dns: {
        title: '🏷️ DNS Problems',
        content: `
          <h5>Common Symptoms:</h5>
          <ul>
            <li>Websites don't resolve</li>
            <li>"Server not found" errors</li>
            <li>Slow page loading</li>
          </ul>
          <h5>Solutions:</h5>
          <ul>
            <li>Try using public DNS (8.8.8.8, 1.1.1.1)</li>
            <li>Flush DNS cache: ipconfig /flushdns</li>
            <li>Check DNS settings in network adapter</li>
            <li>Contact IT for corporate DNS servers</li>
          </ul>
        `
      },
      bandwidth: {
        title: '📊 Bandwidth/Speed Issues',
        content: `
          <h5>Common Symptoms:</h5>
          <ul>
            <li>Very slow loading times</li>
            <li>Timeouts on large requests</li>
            <li>Video/streaming issues</li>
          </ul>
          <h5>Solutions:</h5>
          <ul>
            <li>Check if others have similar issues</li>
            <li>Try during off-peak hours</li>
            <li>Close bandwidth-heavy applications</li>
            <li>Contact IT about bandwidth allocation</li>
          </ul>
        `
      }
    };

    const solution = solutions[issueType];
    if (solution) {
      this.popup.custom({
        title: solution.title,
        html: `<div class="solution-content">${solution.content}</div>`,
        width: '550px',
        buttons: [
          {
            label: 'Test My Connection',
            action: () => {
              this.popup.closeAll();
              setTimeout(() => this.runFullDiagnostics(), 500);
            },
            style: 'primary'
          },
          {
            label: 'Close',
            action: () => this.popup.closeAll(),
            style: 'secondary'
          }
        ]
      });
    }
  }
}
