import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StateService } from './state.service';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

export interface SessionConfirmation {
  show: boolean;
  message: string;
  timeLeft: number;
  onConfirm: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class SessionConfirmationService {
  private stateService = inject(StateService);
  private authService = inject(AuthService);
  private router = inject(Router);

  private confirmationSubject = new BehaviorSubject<SessionConfirmation | null>(null);
  public confirmation$ = this.confirmationSubject.asObservable();

  showSessionConfirmation(): Promise<boolean> {
    return new Promise((resolve) => {
      let timeLeft = 60;
      let timer: any;
      
      const confirmation: SessionConfirmation = {
        show: true,
        message: '¿Sigues ahí? Tu sesión está por expirar. Haz clic en "Continuar" para mantener tu sesión activa.',
        timeLeft: timeLeft,
        onConfirm: () => {
          if (timer) clearInterval(timer);
          this.confirmationSubject.next(null);
          
          // Renovar token automáticamente cuando el usuario confirma
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            this.authService.refreshToken().subscribe({
              next: (response: any) => {
                console.log('✅ Token renovado por confirmación de usuario');
                resolve(true);
              },
              error: (error) => {
                console.error('❌ Error al renovar token:', error);
                resolve(false);
              }
            });
          } else {
            resolve(true);
          }
        }
      };
      
      this.confirmationSubject.next(confirmation);
      
      // Iniciar temporizador de 60 segundos
      timer = setInterval(() => {
        timeLeft--;
        confirmation.timeLeft = timeLeft;
        this.confirmationSubject.next({ ...confirmation });
        
        if (timeLeft <= 0) {
          clearInterval(timer);
          this.confirmationSubject.next(null);
          this.authService.logout();
          this.router.navigate(['/login']);
          resolve(false);
        }
      }, 1000);
    });
  }

  hideConfirmation(): void {
    this.confirmationSubject.next(null);
  }
} 