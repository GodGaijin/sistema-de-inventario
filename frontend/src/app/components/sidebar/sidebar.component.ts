import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { StateService } from '../../services/state.service';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sidebar" [class.collapsed]="isCollapsed()">
      <div class="sidebar-header">
        <h2>Sistema de Inventario</h2>
        <button class="toggle-btn" (click)="toggleSidebar()">
          {{ isCollapsed() ? '☰' : '✕' }}
        </button>
      </div>
      
      <nav class="sidebar-nav">
        <div class="nav-item" (click)="navigateTo('/dashboard')" [class.active]="isActive('/dashboard')">
          <span class="nav-icon">🏠</span>
          <span class="nav-text">Inicio</span>
        </div>
        
        <div class="nav-item" (click)="navigateTo('/products')" [class.active]="isActive('/products')">
          <span class="nav-icon">📦</span>
          <span class="nav-text">Productos</span>
        </div>
        
        <div class="nav-item" (click)="navigateTo('/categories')" [class.active]="isActive('/categories')">
          <span class="nav-icon">📂</span>
          <span class="nav-text">Categorías</span>
        </div>
        
        <div class="nav-item" (click)="navigateTo('/distributors')" [class.active]="isActive('/distributors')">
          <span class="nav-icon">🏢</span>
          <span class="nav-text">Distribuidores</span>
        </div>
        
        <div class="nav-item" (click)="navigateTo('/commerce-data')" [class.active]="isActive('/commerce-data')">
          <span class="nav-icon">🏪</span>
          <span class="nav-text">Datos del Comercio</span>
        </div>
        
        <div *ngIf="isAdmin()" class="nav-item" (click)="navigateTo('/audits')" [class.active]="isActive('/audits')">
          <span class="nav-icon">📊</span>
          <span class="nav-text">Auditoría</span>
        </div>
        
        <div *ngIf="isSeniorAdmin()" class="nav-item admin-senior" (click)="navigateTo('/user-management')" [class.active]="isActive('/user-management')">
          <span class="nav-icon">👥</span>
          <span class="nav-text">Gestión de Usuarios</span>
          <span class="admin-badge">Admin</span>
        </div>
        
        <div class="nav-item" (click)="navigateTo('/settings')" [class.active]="isActive('/settings')">
          <span class="nav-icon">⚙️</span>
          <span class="nav-text">Ajustes</span>
        </div>
      </nav>
      
      <div class="sidebar-footer">
        <div class="user-info">
          <span class="user-name">{{ currentUser()?.username }}</span>
          <span class="user-role">{{ getRoleText() }}</span>
        </div>
        <button class="logout-btn" (click)="logout()">
          <span class="nav-icon">🚪</span>
          <span class="nav-text">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private stateService = inject(StateService);
  private sidebarService = inject(SidebarService);

  // Signals reactivos
  currentUser = this.stateService.currentUser;
  isAdmin = this.stateService.isAdmin;
  isSeniorAdmin = this.stateService.isSeniorAdmin;
  
  // Estado de la barra lateral
  isCollapsed = this.sidebarService.isCollapsed;

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
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
} 