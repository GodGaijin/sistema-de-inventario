import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionConfirmationService } from '../../services/session-confirmation.service';

@Component({
  selector: 'app-session-confirmation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="confirmation" class="session-confirmation-overlay">
      <div class="session-confirmation-modal">
        <div class="modal-header">
          <h3>🕐 Sesión por Expirar</h3>
          <div class="timer">
            <span class="timer-text">Tiempo restante:</span>
            <span class="timer-countdown" [class.warning]="confirmation.timeLeft <= 10">
              {{ confirmation.timeLeft }}s
            </span>
          </div>
        </div>
        <div class="modal-body">
          <p>{{ confirmation.message }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" (click)="confirmation.onConfirm()">
            Continuar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .session-confirmation-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    }

    .session-confirmation-modal {
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-header {
      margin-bottom: 16px;
      text-align: center;
    }

    .modal-header h3 {
      margin: 0 0 12px 0;
      color: #333;
      font-size: 1.2rem;
    }

    .timer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 8px;
    }

    .timer-text {
      font-size: 0.9rem;
      color: #666;
    }

    .timer-countdown {
      font-size: 1.1rem;
      font-weight: bold;
      color: #007bff;
      min-width: 30px;
      text-align: center;
    }

    .timer-countdown.warning {
      color: #dc3545;
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    .modal-body {
      margin-bottom: 24px;
      text-align: center;
    }

    .modal-body p {
      margin: 0;
      color: #666;
      line-height: 1.5;
    }

    .modal-footer {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background: #0056b3;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #545b62;
    }
  `]
})
export class SessionConfirmationComponent {
  private sessionConfirmationService = inject(SessionConfirmationService);
  confirmation: any = null;

  constructor() {
    this.sessionConfirmationService.confirmation$.subscribe(confirmation => {
      this.confirmation = confirmation;
    });
  }
} 