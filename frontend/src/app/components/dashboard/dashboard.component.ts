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
    console.log('Dashboard initialized');
    console.log('Current user:', this.currentUser());
    console.log('Is admin:', this.isAdmin());
    console.log('Is senior admin:', this.isSeniorAdmin());
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
    console.log('Loading active users...');
    this.loadingActiveUsers = true;
    this.apiService.getActiveUsersWithRoles().subscribe({
      next: (data) => {
        console.log('Active users data:', data);
        this.activeUsers = data.activeUsers || [];
        this.activeUsersCount = data.activeUsersCount || 0;
        this.loadingActiveUsers = false;
        console.log('Active users loaded:', this.activeUsers.length);
      },
      error: (error) => {
        console.error('Error loading active users:', error);
        this.loadingActiveUsers = false;
      }
    });
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
