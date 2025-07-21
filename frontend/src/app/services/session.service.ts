import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { StateService } from './state.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private authService = inject(AuthService);
  private stateService = inject(StateService);
  private router = inject(Router);
  private sessionCheckInterval: any;

  constructor() {
    this.startSessionMonitoring();
  }

  private startSessionMonitoring() {
    // Verificar cada minuto si el token está próximo a expirar
    this.sessionCheckInterval = setInterval(() => {
      this.checkTokenExpiration();
    }, 60000); // 1 minuto
  }

  private checkTokenExpiration() {
    if (!this.authService.isAuthenticated()) {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        // Token expirado pero hay refresh token, verificar sesión
        this.authService.checkSession().subscribe({
          next: (response: any) => {
            if (response.sessionExpired) {
              // Refresh token también expirado
              this.authService.logout();
              this.router.navigate(['/login']);
              this.stateService.addNotification({
                message: 'Sesión expirada. Por favor, inicie sesión nuevamente.',
                type: 'warning'
              });
            } else {
              // Sesión renovada automáticamente
              this.stateService.addNotification({
                message: '¿Sigues ahí? Tu sesión se ha extendido automáticamente.',
                type: 'info'
              });
            }
          },
          error: (error) => {
            console.error('Error checking session:', error);
            this.authService.logout();
            this.router.navigate(['/login']);
            this.stateService.addNotification({
              message: 'Error de sesión. Por favor, inicie sesión nuevamente.',
              type: 'error'
            });
          }
        });
      } else {
        // No hay refresh token, cerrar sesión
        this.authService.logout();
        this.router.navigate(['/login']);
        this.stateService.addNotification({
          message: 'Sesión no válida. Por favor, inicie sesión nuevamente.',
          type: 'warning'
        });
      }
    }
  }

  public stopSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  public restartSessionMonitoring() {
    this.stopSessionMonitoring();
    this.startSessionMonitoring();
  }
} 