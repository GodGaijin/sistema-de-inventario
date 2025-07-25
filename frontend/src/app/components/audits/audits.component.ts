import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-audits',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audits.component.html',
  styleUrls: ['./audits.component.css']
})
export class AuditsComponent {
  audits: any[] = [];
  loading = false;
  message = '';
  messageType = '';
  isAdmin = false;

  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    // Obtener estado de admin inmediatamente
    this.isAdmin = this.authService.isAdmin();
    this.loadData();
    
    // Suscribirse a cambios del usuario para actualizar estado de admin
    this.authService.currentUser.subscribe(user => {
      this.isAdmin = this.authService.isAdmin();
    });
  }

  loadData(): void {
    this.loading = true;
    this.apiService.getAudits().subscribe({
      next: (data: any[]) => {
        this.audits = data;
        this.loading = false;
      },
      error: (error: any) => {
        this.showMessage('Error al cargar auditoría', 'error');
        this.loading = false;
      }
    });
  }

  formatTimestamp(timestamp: string): string {
    try {
      // Verificar si el timestamp ya es válido
      let date: Date;
      
      if (!timestamp || timestamp === 'Invalid Date') {
        return 'Fecha no disponible';
      }
      
      // Si el timestamp ya termina en Z, no agregar otra Z
      if (timestamp.endsWith('Z')) {
        date = new Date(timestamp);
      } else {
        // Si no termina en Z, agregar Z para indicar UTC
        date = new Date(timestamp + 'Z');
      }
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        console.error('Timestamp inválido:', timestamp);
        return 'Fecha inválida';
      }
      
      // Convert UTC timestamp to Venezuelan time
      return date.toLocaleString('es-VE', {
        timeZone: 'America/Caracas',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      console.error('Error formateando timestamp:', error, timestamp);
      return 'Error en fecha';
    }
  }

  getActionText(action: string): string {
    switch (action) {
      case 'CREATE': return 'Crear';
      case 'UPDATE': return 'Actualizar';
      case 'DELETE': return 'Eliminar';
      case 'APPROVE': return 'Aprobar';
      case 'REJECT': return 'Rechazar';
      case 'EXPORT': return 'Exportar';
      default: return action;
    }
  }

  getEntityText(entity: string): string {
    switch (entity) {
      case 'products': return 'Productos';
      case 'categories': return 'Categorías';
      case 'distributors': return 'Distribuidores';
      case 'users': return 'Usuarios';
      case 'inventory_request': return 'Solicitud de Inventario';
      case 'inventory_transaction': return 'Transacción de Inventario';
      case 'inventory_transactions': return 'Transacciones de Inventario';
      default: return entity;
    }
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  private showMessage(message: string, type: string): void {
    this.message = message;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
      this.messageType = '';
    }, 3000);
  }
} 
