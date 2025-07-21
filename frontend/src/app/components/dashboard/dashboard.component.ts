import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { StateService } from '../../services/state.service';
import { ApiService } from '../../services/api.service';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private stateService = inject(StateService);
  private apiService = inject(ApiService);

  // Signals reactivos
  currentUser = this.stateService.currentUser;
  isAdmin = this.stateService.isAdmin;
  isSeniorAdmin = this.stateService.isSeniorAdmin;

  // Información de usuarios activos
  activeUsers: any[] = [];
  activeUsersCount = 0;
  loadingActiveUsers = false;

  ngOnInit(): void {
    console.log('🚀 Dashboard component initialized');
    console.log('👤 Current user:', this.currentUser());
    console.log('🔑 User role:', this.currentUser()?.role);
    this.loadActiveUsers();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  loadActiveUsers(): void {
    // Solo cargar si es admin o senior admin
    const isAdminUser = this.isAdmin();
    const isSeniorAdminUser = this.isSeniorAdmin();
    
    console.log('🔍 Verificando roles para cargar usuarios activos:');
    console.log('isAdmin:', isAdminUser);
    console.log('isSeniorAdmin:', isSeniorAdminUser);
    
    if (isAdminUser || isSeniorAdminUser) {
      console.log('✅ Cargando usuarios activos...');
      this.loadingActiveUsers = true;
      this.apiService.getActiveUsersWithRoles().subscribe({
        next: (data) => {
          console.log('📊 Datos de usuarios activos recibidos:', data);
          this.activeUsers = data.activeUsers || [];
          this.activeUsersCount = data.activeUsersCount || 0;
          this.loadingActiveUsers = false;
          console.log('✅ Usuarios activos cargados:', this.activeUsers.length);
        },
        error: (error) => {
          console.error('❌ Error loading active users:', error);
          this.loadingActiveUsers = false;
        }
      });
    } else {
      console.log('❌ Usuario no tiene permisos para ver usuarios activos');
    }
  }

  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'user': return 'Usuario';
      case 'admin': return 'Administrador';
      case 'senior_admin': return 'Admin Senior';
      default: return role;
    }
  }

  formatLastActivity(lastActivity: string): string {
    if (!lastActivity) return 'Desconocido';
    
    const date = new Date(lastActivity);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays}d`;
  }
} 
