import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { StateService } from '../../services/state.service';
import { ApiService } from '../../services/api.service';
import { SecurityService } from '../../services/security.service';

interface SettingsForm {
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  notificationsEnabled: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-container">
      <div class="settings-header">
        <h1>⚙️ Ajustes de Cuenta</h1>
        <p>Gestiona tu información personal y preferencias</p>
      </div>

      <div class="settings-content">
        <!-- Información del Usuario -->
        <div class="settings-section">
          <h2>👤 Información del Usuario</h2>
          <div class="user-info-card">
            <div class="info-row">
              <span class="info-label">Nombre de Usuario:</span>
              <span class="info-value">{{ currentUser()?.username }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Rol:</span>
              <span class="info-value">{{ getRoleText() }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email Actual:</span>
              <span class="info-value">{{ currentUser()?.email || 'No configurado' }}</span>
            </div>
          </div>
        </div>

        <!-- Cambiar Email -->
        <div class="settings-section">
          <h2>📧 Cambiar Email</h2>
          <div class="form-group">
            <label for="email">Nuevo Email:</label>
            <input 
              type="email" 
              id="email" 
              [(ngModel)]="form.email" 
              placeholder="nuevo@email.com"
              class="form-control"
            >
          </div>
          <button 
            (click)="updateEmail()" 
            class="btn btn-primary"
            [disabled]="!form.email || isUpdating()"
          >
            {{ isUpdating() ? 'Actualizando...' : 'Actualizar Email' }}
          </button>
        </div>

        <!-- Cambiar Contraseña -->
        <div class="settings-section">
          <h2>🔐 Cambiar Contraseña</h2>
          <div class="form-group">
            <label for="currentPassword">Contraseña Actual:</label>
            <input 
              type="password" 
              id="currentPassword" 
              [(ngModel)]="form.currentPassword" 
              placeholder="Tu contraseña actual"
              class="form-control"
            >
          </div>
          <div class="form-group">
            <label for="newPassword">Nueva Contraseña:</label>
            <input 
              type="password" 
              id="newPassword" 
              [(ngModel)]="form.newPassword" 
              placeholder="Nueva contraseña"
              class="form-control"
            >
            <small class="form-help">
              Mínimo una letra, un número y un carácter especial
            </small>
          </div>
          <div class="form-group">
            <label for="confirmPassword">Confirmar Nueva Contraseña:</label>
            <input 
              type="password" 
              id="confirmPassword" 
              [(ngModel)]="form.confirmPassword" 
              placeholder="Confirma la nueva contraseña"
              class="form-control"
            >
          </div>
          <button 
            (click)="updatePassword()" 
            class="btn btn-primary"
            [disabled]="!canUpdatePassword() || isUpdating()"
          >
            {{ isUpdating() ? 'Actualizando...' : 'Cambiar Contraseña' }}
          </button>
        </div>

        <!-- Configuración de Notificaciones -->
        <div class="settings-section">
          <h2>🔔 Configuración de Notificaciones</h2>
          <div class="notification-settings">
            <div class="setting-item">
              <div class="setting-info">
                <h4>Notificaciones del Sistema</h4>
                <p>Recibir notificaciones sobre actividades del sistema</p>
              </div>
              <label class="switch">
                <input 
                  type="checkbox" 
                  [(ngModel)]="form.notificationsEnabled"
                  (change)="updateNotificationSettings()"
                >
                <span class="slider"></span>
              </label>
            </div>
            <small class="form-help">
              Las notificaciones de renovación de sesión siempre estarán activas por seguridad
            </small>
          </div>
        </div>

        <!-- Autenticación en dos pasos (2FA) -->
        <div class="settings-section">
          <h2>🔐 Autenticación en dos pasos (2FA)</h2>
          <div class="twofa-settings">
            <div *ngIf="twoFAStatus?.enabled; else activar2FA">
              <p>2FA está <strong>activado</strong> en tu cuenta.</p>
              <button (click)="disable2FA()" class="btn btn-warning">Desactivar 2FA</button>
            </div>
            <ng-template #activar2FA>
              <p>2FA está <strong>desactivado</strong> en tu cuenta.</p>
              <button (click)="setup2FA()" class="btn btn-primary">Activar 2FA</button>
            </ng-template>
            <div *ngIf="qrCode" class="qr-section">
              <p>Escanea este código QR con tu app de autenticación:</p>
              <img [src]="qrCode" alt="QR 2FA" class="qr-code">
              <p><strong>Códigos de respaldo:</strong></p>
              <ul class="backup-codes">
                <li *ngFor="let code of backupCodes">{{ code }}</li>
              </ul>
              <p>Ingresa el código generado por tu app para completar la activación:</p>
              <input [(ngModel)]="twoFACode" maxlength="6" class="form-control" placeholder="Código 2FA">
              <button (click)="verify2FA()" class="btn btn-primary">Verificar y Activar</button>
            </div>
          </div>
        </div>

        <!-- Acciones de Cuenta -->
        <div class="settings-section">
          <h2>⚠️ Acciones de Cuenta</h2>
          <div class="danger-zone">
            <div class="danger-item">
              <div class="danger-info">
                <h4>Cerrar Sesión en Todos los Dispositivos</h4>
                <p>Forzar el cierre de sesión en todos los dispositivos conectados</p>
              </div>
              <button class="btn btn-warning" (click)="logoutAllDevices()">
                Cerrar Todas las Sesiones
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  private authService = inject(AuthService);
  private stateService = inject(StateService);
  private apiService = inject(ApiService);
  private securityService = inject(SecurityService);

  // Signals reactivos
  currentUser = this.stateService.currentUser;
  isUpdating = signal(false);

  // Formulario de ajustes
  form: SettingsForm = {
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notificationsEnabled: true
  };

  twoFAStatus: any = null;
  qrCode: string | null = null;
  backupCodes: string[] = [];
  twoFACode: string = '';

  updateEmail(): void {
    if (!this.form.email) return;

    this.isUpdating.set(true);
    // Aquí implementarías la llamada al API para actualizar email
    setTimeout(() => {
      this.stateService.addNotification({
        message: 'Email actualizado correctamente',
        type: 'success'
      });
      this.isUpdating.set(false);
      this.form.email = '';
    }, 1000);
  }

  updatePassword(): void {
    if (!this.canUpdatePassword()) return;

    this.isUpdating.set(true);
    // Aquí implementarías la llamada al API para actualizar contraseña
    setTimeout(() => {
      this.stateService.addNotification({
        message: 'Contraseña actualizada correctamente',
        type: 'success'
      });
      this.isUpdating.set(false);
      this.form.currentPassword = '';
      this.form.newPassword = '';
      this.form.confirmPassword = '';
    }, 1000);
  }

  updateNotificationSettings(): void {
    // Aquí implementarías la llamada al API para actualizar configuraciones
    this.stateService.addNotification({
      message: 'Configuración de notificaciones actualizada',
      type: 'info'
    });
  }

  logoutAllDevices(): void {
    if (confirm('¿Estás seguro de que quieres cerrar sesión en todos los dispositivos?')) {
      this.authService.logout();
      this.stateService.addNotification({
        message: 'Sesión cerrada en todos los dispositivos',
        type: 'warning'
      });
    }
  }

  canUpdatePassword(): boolean {
    return !!(
      this.form.currentPassword &&
      this.form.newPassword &&
      this.form.confirmPassword &&
      this.form.newPassword === this.form.confirmPassword &&
      this.authService.validatePassword(this.form.newPassword)
    );
  }

  getRoleText(): string {
    const user = this.currentUser();
    if (!user) return '';
    
    switch (user.role) {
      case 'senior_admin': return 'Administrador Senior';
      case 'admin': return 'Administrador';
      default: return 'Usuario';
    }
  }

  ngOnInit() {
    this.load2FAStatus();
  }

  load2FAStatus() {
    this.securityService.getTwoFAStatus().subscribe((status: any) => this.twoFAStatus = status);
  }

  setup2FA() {
    this.securityService.setup2FA().subscribe((data: any) => {
      this.qrCode = data.qrCode;
      this.backupCodes = data.backupCodes;
    });
  }

  verify2FA() {
    this.securityService.verify2FA(this.twoFACode).subscribe(() => {
      this.qrCode = null;
      this.backupCodes = [];
      this.twoFACode = '';
      this.load2FAStatus();
      this.stateService.addNotification({
        message: '2FA activado correctamente',
        type: 'success'
      });
    });
  }

  disable2FA() {
    this.securityService.disable2FA(this.twoFACode).subscribe(() => {
      this.load2FAStatus();
      this.stateService.addNotification({
        message: '2FA desactivado correctamente',
        type: 'success'
      });
    });
  }
} 