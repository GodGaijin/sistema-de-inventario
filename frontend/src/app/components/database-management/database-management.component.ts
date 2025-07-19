import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { signal, computed, effect } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';

interface Backup {
  name: string;
  size: number;
  created: Date;
  modified: Date;
}

@Component({
  selector: 'app-database-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './database-management.component.html',
  styleUrls: ['./database-management.component.css']
})
export class DatabaseManagementComponent {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private stateService = inject(StateService);

  // Signals reactivos
  private _backups = signal<Backup[]>([]);
  private _loading = signal(false);
  private _selectedBackup = signal('');
  private _lastUpdate = signal<Date>(new Date());

  // Signals públicos
  backups = this._backups.asReadonly();
  loading = this._loading.asReadonly();
  selectedBackup = this._selectedBackup.asReadonly();
  lastUpdate = this._lastUpdate.asReadonly();

  // Computed signals
  hasBackups = computed(() => this._backups().length > 0);
  backupCount = computed(() => this._backups().length);
  totalSize = computed(() => 
    this._backups().reduce((total, backup) => total + backup.size, 0)
  );

  // Intervalo para actualización automática
  private updateInterval: any;

  constructor() {
    this.loadBackups();
    
    // Actualizar backups automáticamente cada 10 segundos (sin mostrar mensajes)
    this.updateInterval = setInterval(() => {
      this.loadBackupsSilently();
    }, 10000);
  }

  // Método para limpiar recursos
  cleanup(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  loadBackups(): void {
    this._loading.set(true);
    this.apiService.getBackups().subscribe({
      next: (response) => {
        this._backups.set(response.backups);
        this._lastUpdate.set(new Date());
        this._loading.set(false);
      },
      error: (error) => {
        this.stateService.addNotification({
          message: 'Error al cargar backups: ' + error.error.message,
          type: 'error'
        });
        this._loading.set(false);
      }
    });
  }

  loadBackupsSilently(): void {
    this.apiService.getBackups().subscribe({
      next: (response) => {
        this._backups.set(response.backups);
        this._lastUpdate.set(new Date());
      },
      error: (error) => {
        // Solo log del error, sin mostrar notificación
        console.error('Error al cargar backups automáticamente:', error);
      }
    });
  }

  saveBackup(): void {
    this._loading.set(true);
    this.apiService.saveBackup().subscribe({
      next: (response) => {
        this.stateService.addNotification({
          message: 'Backup guardado exitosamente: ' + response.backupName,
          type: 'success'
        });
        this.loadBackups(); // Recargar lista automáticamente
        this._loading.set(false);
      },
      error: (error) => {
        this.stateService.addNotification({
          message: 'Error al guardar backup: ' + error.error.message,
          type: 'error'
        });
        this._loading.set(false);
      }
    });
  }

  restoreBackup(): void {
    const selected = this._selectedBackup();
    if (!selected) {
      this.stateService.addNotification({
        message: 'Por favor selecciona un backup para restaurar',
        type: 'warning'
      });
      return;
    }

    if (confirm('¿Estás seguro de que quieres restaurar la base de datos? Esta acción no se puede deshacer.')) {
      this._loading.set(true);
      this.apiService.restoreBackup(selected).subscribe({
        next: (response) => {
          this.stateService.addNotification({
            message: 'Base de datos restaurada exitosamente desde: ' + response.restoredFrom,
            type: 'success'
          });
          this._selectedBackup.set('');
          this.loadBackups(); // Recargar lista automáticamente
          this._loading.set(false);
        },
        error: (error) => {
          this.stateService.addNotification({
            message: 'Error al restaurar backup: ' + error.error.message,
            type: 'error'
          });
          this._loading.set(false);
        }
      });
    }
  }

  deleteBackup(backupName: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar el backup: ' + backupName + '?')) {
      this._loading.set(true);
      this.apiService.deleteBackup(backupName).subscribe({
        next: (response) => {
          this.stateService.addNotification({
            message: 'Backup eliminado exitosamente',
            type: 'success'
          });
          this.loadBackups(); // Recargar lista automáticamente
          this._loading.set(false);
        },
        error: (error) => {
          this.stateService.addNotification({
            message: 'Error al eliminar backup: ' + error.error.message,
            type: 'error'
          });
          this._loading.set(false);
        }
      });
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString('es-ES');
  }

  selectBackup(backupName: string): void {
    this._selectedBackup.set(backupName);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
} 
