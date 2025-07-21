import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StateService } from './state.service';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

export interface SessionConfirmation {
  show: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
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
      const confirmation: SessionConfirmation = {
        show: true,
        message: '¿Sigues ahí? Tu sesión está por expirar. ¿Quieres continuar?',
        onConfirm: () => {
          this.confirmationSubject.next(null);
          resolve(true);
        },
        onCancel: () => {
          this.confirmationSubject.next(null);
          this.authService.logout();
          this.router.navigate(['/login']);
          resolve(false);
        }
      };
      
      this.confirmationSubject.next(confirmation);
    });
  }

  hideConfirmation(): void {
    this.confirmationSubject.next(null);
  }
} 