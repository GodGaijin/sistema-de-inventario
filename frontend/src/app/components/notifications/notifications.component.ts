import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container" *ngIf="notifications().length > 0">
      <div 
        *ngFor="let notification of notifications()" 
        class="notification"
        [ngClass]="'notification-' + notification.type"
        [@notificationAnimation]
      >
        <div class="notification-content">
          <span class="notification-icon">
            {{ getIcon(notification.type) }}
          </span>
          <span class="notification-message">{{ notification.message }}</span>
          <button 
            class="notification-close" 
            (click)="removeNotification(notification.id)"
            aria-label="Cerrar notificación"
          >
            ×
          </button>
        </div>
        <div 
          *ngIf="notification.autoClose !== false" 
          class="notification-progress"
          [style.animation-duration]="'5s'"
        ></div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 400px;
      width: 100%;
    }

    .notification {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      margin-bottom: 10px;
      overflow: hidden;
      position: relative;
      border-left: 4px solid;
    }

    .notification-success {
      border-left-color: #28a745;
    }

    .notification-error {
      border-left-color: #dc3545;
    }

    .notification-warning {
      border-left-color: #ffc107;
    }

    .notification-info {
      border-left-color: #17a2b8;
    }

    .notification-content {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      gap: 12px;
    }

    .notification-icon {
      font-size: 18px;
      flex-shrink: 0;
    }

    .notification-message {
      flex: 1;
      font-size: 14px;
      line-height: 1.4;
    }

    .notification-close {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s;
    }

    .notification-close:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }

    .notification-progress {
      height: 3px;
      background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.2));
      animation: progress 5s linear;
    }

    @keyframes progress {
      from { width: 100%; }
      to { width: 0%; }
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }

    .notification {
      animation: slideIn 0.3s ease-out;
    }

    .notification.removing {
      animation: slideOut 0.3s ease-in;
    }

    @media (max-width: 480px) {
      .notifications-container {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
      }
    }
  `],
  animations: [
    // Aquí podrías agregar animaciones más complejas si es necesario
  ]
})
export class NotificationsComponent {
  private stateService = inject(StateService);

  // Signals
  notifications = this.stateService.notifications;

  getIcon(type: string): string {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  }

  removeNotification(id: string): void {
    this.stateService.removeNotification(id);
  }
} 
