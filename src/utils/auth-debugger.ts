/**
 * Authentication Debugger for Development
 * Provides detailed insights into auth flow and issues
 */
export class AuthDebugger {
  private static instance: AuthDebugger;
  private events: AuthEvent[] = [];
  private isEnabled: boolean = process.env.NODE_ENV === 'development';
  
  private constructor() {
    if (this.isEnabled) {
      this.setupDebugger();
    }
  }
  
  static getInstance(): AuthDebugger {
    if (!AuthDebugger.instance) {
      AuthDebugger.instance = new AuthDebugger();
    }
    return AuthDebugger.instance;
  }
  
  private setupDebugger(): void {
    // Create debug panel
    if (typeof window !== 'undefined') {
      this.createDebugPanel();
      this.interceptAuthEvents();
      this.monitorTokens();
      this.trackAPIRequests();
    }
  }
  
  private createDebugPanel(): void {
    const panel = document.createElement('div');
    panel.id = 'auth-debug-panel';
    panel.innerHTML = `
      <style>
        #auth-debug-panel {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 400px;
          max-height: 500px;
          background: #1a1a1a;
          color: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 12px;
          z-index: 99999;
          transition: all 0.3s ease;
        }
        #auth-debug-panel.minimized {
          height: 40px;
          overflow: hidden;
        }
        .debug-header {
          background: #2a2a2a;
          padding: 10px;
          border-radius: 8px 8px 0 0;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .debug-status {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-right: 5px;
        }
        .debug-status.authenticated { background: #4caf50; }
        .debug-status.unauthenticated { background: #f44336; }
        .debug-status.loading { background: #ff9800; }
        .debug-content {
          padding: 10px;
          max-height: 400px;
          overflow-y: auto;
        }
        .debug-section {
          margin-bottom: 15px;
          padding: 10px;
          background: #2a2a2a;
          border-radius: 4px;
        }
        .debug-section h4 {
          margin: 0 0 10px 0;
          color: #64b5f6;
          font-size: 11px;
          text-transform: uppercase;
        }
        .debug-event {
          padding: 5px;
          margin: 2px 0;
          background: #333;
          border-radius: 3px;
          display: flex;
          justify-content: space-between;
        }
        .debug-event.error { background: #5c2020; }
        .debug-event.success { background: #1b5e20; }
        .debug-event.warning { background: #5c4020; }
        .debug-timestamp {
          opacity: 0.6;
          font-size: 10px;
        }
        .debug-actions {
          margin-top: 10px;
          display: flex;
          gap: 5px;
        }
        .debug-btn {
          padding: 5px 10px;
          background: #333;
          border: none;
          color: #fff;
          border-radius: 3px;
          cursor: pointer;
          font-size: 11px;
        }
        .debug-btn:hover { background: #444; }
        .debug-close {
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
        }
      </style>
      <div class="debug-header" onclick="authDebugger.toggle()">
        <div>
          <span class="debug-status unauthenticated" id="auth-status-indicator"></span>
          Auth Debugger
        </div>
        <button class="debug-close" onclick="authDebugger.close()">×</button>
      </div>
      <div class="debug-content" id="debug-content">
        <div class="debug-section">
          <h4>Current State</h4>
          <div id="auth-state-info">Loading...</div>
        </div>
        <div class="debug-section">
          <h4>Recent Events</h4>
          <div id="auth-events-list"></div>
        </div>
        <div class="debug-section">
          <h4>Token Info</h4>
          <div id="token-info">No token</div>
        </div>
        <div class="debug-actions">
          <button class="debug-btn" onclick="authDebugger.clearEvents()">Clear Events</button>
          <button class="debug-btn" onclick="authDebugger.exportLogs()">Export Logs</button>
          <button class="debug-btn" onclick="authDebugger.simulateTokenExpiry()">Simulate Expiry</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Make debugger available globally for dev tools
    (window as any).authDebugger = this;
  }
  
  private interceptAuthEvents(): void {
    // Intercept all auth-related events
    const authEvents = [
      'auth:login-attempt',
      'auth:login-success',
      'auth:login-failed',
      'auth:logout',
      'auth:token-refresh',
      'auth:session-expiring-soon',
      'auth:unauthorized',
      'csrf:token-rotated'
    ];
    
    authEvents.forEach(eventType => {
      window.addEventListener(eventType, (event: any) => {
        this.logEvent({
          type: eventType,
          timestamp: new Date(),
          data: event.detail,
          level: this.getEventLevel(eventType)
        });
      });
    });
  }
  
  private monitorTokens(): void {
    setInterval(() => {
      this.updateTokenInfo();
      this.updateAuthState();
    }, 1000);
  }
  
  private trackAPIRequests(): void {
    // Intercept fetch for API tracking
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, config] = args;
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;
        
        if (url.toString().includes('/auth/')) {
          this.logEvent({
            type: 'api:request',
            timestamp: new Date(),
            data: {
              url: url.toString(),
              method: config?.method || 'GET',
              status: response.status,
              duration: `${duration.toFixed(2)}ms`
            },
            level: response.ok ? 'success' : 'error'
          });
        }
        
        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        this.logEvent({
          type: 'api:request',
          timestamp: new Date(),
          data: {
            url: url.toString(),
            method: config?.method || 'GET',
            error: error.message,
            duration: `${duration.toFixed(2)}ms`
          },
          level: 'error'
        });
        throw error;
      }
    };
  }
  
  private logEvent(event: AuthEvent): void {
    this.events.unshift(event);
    if (this.events.length > 50) {
      this.events = this.events.slice(0, 50);
    }
    
    this.updateEventsList();
  }
  
  private updateEventsList(): void {
    const container = document.getElementById('auth-events-list');
    if (!container) return;
    
    container.innerHTML = this.events
      .slice(0, 10)
      .map(event => `
        <div class="debug-event ${event.level}">
          <span>${event.type}</span>
          <span class="debug-timestamp">${this.formatTime(event.timestamp)}</span>
        </div>
      `)
      .join('');
  }
  
  private updateTokenInfo(): void {
    const container = document.getElementById('token-info');
    if (!container) return;
    
    const token = (window as any).__authToken;
    if (!token) {
      container.innerHTML = 'No token present';
      return;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = new Date(payload.exp * 1000);
      const now = new Date();
      const timeLeft = expiry.getTime() - now.getTime();
      
      container.innerHTML = `
        <div>Expires: ${expiry.toLocaleTimeString()}</div>
        <div>Time left: ${this.formatDuration(timeLeft)}</div>
        <div>User ID: ${payload.user?.id || 'Unknown'}</div>
      `;
    } catch {
      container.innerHTML = 'Invalid token format';
    }
  }
  
  private updateAuthState(): void {
    const stateContainer = document.getElementById('auth-state-info');
    const statusIndicator = document.getElementById('auth-status-indicator');
    if (!stateContainer || !statusIndicator) return;
    
    // This would be connected to your actual auth context
    const isAuthenticated = !!(window as any).__authToken;
    const user = (window as any).__currentUser;
    
    statusIndicator.className = `debug-status ${isAuthenticated ? 'authenticated' : 'unauthenticated'}`;
    
    stateContainer.innerHTML = `
      <div>Authenticated: ${isAuthenticated ? 'Yes' : 'No'}</div>
      ${user ? `<div>User: ${user.email}</div>` : ''}
      <div>CSRF Token: ${document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')?.slice(0, 10)}...</div>
    `;
  }
  
  private getEventLevel(eventType: string): 'info' | 'success' | 'warning' | 'error' {
    if (eventType.includes('success')) return 'success';
    if (eventType.includes('failed') || eventType.includes('error')) return 'error';
    if (eventType.includes('warning') || eventType.includes('expiring')) return 'warning';
    return 'info';
  }
  
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  }
  
  private formatDuration(ms: number): string {
    if (ms < 0) return 'Expired';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
  
  // Public methods
  toggle(): void {
    const panel = document.getElementById('auth-debug-panel');
    if (panel) {
      panel.classList.toggle('minimized');
    }
  }
  
  close(): void {
    const panel = document.getElementById('auth-debug-panel');
    if (panel) {
      panel.remove();
    }
  }
  
  clearEvents(): void {
    this.events = [];
    this.updateEventsList();
  }
  
  exportLogs(): void {
    const logs = {
      timestamp: new Date().toISOString(),
      events: this.events,
      currentState: {
        authenticated: !!(window as any).__authToken,
        user: (window as any).__currentUser,
      }
    };
    
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auth-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  simulateTokenExpiry(): void {
    window.dispatchEvent(new CustomEvent('auth:session-expiring-soon', {
      detail: { minutesLeft: 1 }
    }));
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }, 2000);
  }
}

interface AuthEvent {
  type: string;
  timestamp: Date;
  data?: any;
  level: 'info' | 'success' | 'warning' | 'error';
}

// Initialize in development
if (process.env.NODE_ENV === 'development') {
  AuthDebugger.getInstance();
}