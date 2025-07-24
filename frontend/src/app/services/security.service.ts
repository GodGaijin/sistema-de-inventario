import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SecurityService {
  private apiUrl = environment.apiUrl + '/security';

  constructor(private http: HttpClient) {}

  getUsersWithSecurityInfo(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users/security-info`);
  }

  suspendUser(userId: number, reason: string): Observable<any> {
    // Forzar 14 días (336 horas)
    return this.http.post(`${this.apiUrl}/users/suspend`, { userId, reason, durationHours: 336 }, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  unsuspendUser(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/unsuspend`, { userId }, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  getBlockedIPs(): Observable<any> {
    return this.http.get(`${this.apiUrl}/ips/blocked`);
  }

  blockIP(ipAddress: string, reason: string, durationHours?: number): Observable<any> {
    const body: any = { ipAddress, reason };
    if (durationHours !== undefined) {
      body.durationHours = durationHours;
    }
    return this.http.post(`${this.apiUrl}/ips/block`, body, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  unblockIP(ipAddress: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/ips/unblock`, { ipAddress }, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  getSuspiciousActivity(hours: number = 24): Observable<any> {
    return this.http.get(`${this.apiUrl}/suspicious-activity?hours=${hours}`);
  }

  // 2FA
  getTwoFAStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/2fa/status`);
  }

  setup2FA(): Observable<any> {
    return this.http.post(`${this.apiUrl}/2fa/setup`, {}, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  verify2FA(code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/2fa/verify-setup`, { code }, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  disable2FA(code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/2fa/disable`, { code }, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }
} 