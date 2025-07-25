import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { StateService } from './state.service';
import { SessionConfirmationService } from './session-confirmation.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private authService = inject(AuthService);
  private stateService = inject(StateService);
  private sessionConfirmationService = inject(SessionConfirmationService);
  private router = inject(Router);
  private sessionCheckInterval: any;
  private confirmationShown = false;

  constructor() {
    this.startSessionMonitoring();
  }

  // Función para verificar si el token está a 5 minutos de expirar
  private isTokenExpiringSoon(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = payload.exp - currentTime;
      return timeUntilExpiry <= 300 && timeUntilExpiry > 0; // Entre 0 y 5 minutos
    } catch (error) {
      return false;
    }
  }

  private startSessionMonitoring() {
    // Verificar cada minuto si el token está próximo a expirar
    this.sessionCheckInterval = setInterval(() => {
      this.checkTokenExpiration();
    }, 60000); // 1 minuto
  }

  private checkTokenExpiration() {
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      // Verificar si el token está próximo a expirar
      if (this.isTokenExpiringSoon(token) && !this.confirmationShown) {
        this.confirmationShown = true;
        // Mostrar diálogo de confirmación de sesión
        this.sessionConfirmationService.showSessionConfirmation().then((confirmed) => {
          if (confirmed) {
            // Usuario confirmó, renovar token
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              this.authService.refreshToken().subscribe({
                next: (response: any) => {
                  // Token renovado exitosamente
                  console.log('✅ Token renovado por confirmación de usuario');
                  this.confirmationShown = false; // Reset para futuras verificaciones
                },
                error: (error) => {
                  console.error('❌ Error al renovar token:', error);
                  this.confirmationShown = false; // Reset para futuras verificaciones
                }
              });
            }
          } else {
            // Usuario no confirmó, cerrar sesión
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        });
        return;
      }
    }

    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        // Token expirado pero hay refresh token, verificar sesión
        this.authService.checkSession().subscribe({
          next: (response: any) => {
            if (response.sessionExpired) {
              // Refresh token también expirado, limpiar sesión sin notificación
              this.authService.clearSession();
              this.router.navigate(['/login']);
            }
            // Eliminamos las notificaciones automáticas para evitar spam
          },
          error: (error) => {
            console.error('Error checking session:', error);
            // Error al verificar sesión, limpiar sesión sin notificación
            this.authService.clearSession();
            this.router.navigate(['/login']);
          }
        });
      } else {
        // No hay refresh token, limpiar sesión sin notificación
        this.authService.clearSession();
        this.router.navigate(['/login']);
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