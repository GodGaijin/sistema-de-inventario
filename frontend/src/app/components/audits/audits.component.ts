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
    // Convert UTC timestamp to Venezuelan time
    const date = new Date(timestamp + 'Z');
    return date.toLocaleString('es-VE', {
      timeZone: 'America/Caracas',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
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
