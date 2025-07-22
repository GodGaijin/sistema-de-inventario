import { Component, inject, HostListener } from '@angular/core';
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
    <!-- Mobile Menu Toggle Button -->
    <button 
      class="mobile-menu-toggle" 
      (click)="openMobileMenu()"
      *ngIf="!isDesktop()"
      [attr.aria-label]="'Abrir menú de navegación'"
    >
      ☰
    </button>

    <!-- Mobile Overlay -->
    <div 
      class="sidebar-overlay" 
      [class.open]="isMobileMenuOpen()"
      (click)="closeMobileMenu()"
      *ngIf="!isDesktop()"
    ></div>

    <!-- Sidebar -->
    <div 
      class="sidebar" 
      [class.collapsed]="isCollapsed() && isDesktop()"
      [class.open]="isMobileMenuOpen()"
    >
      <div class="sidebar-header">
        <h2>Sistema de Inventario</h2>
        <button 
          class="close-btn" 
          (click)="closeMobileMenu()"
          *ngIf="!isDesktop()"
          [attr.aria-label]="'Cerrar menú'"
        >
          ✕
        </button>
        <button 
          class="toggle-btn" 
          (click)="toggleSidebar()"
          *ngIf="isDesktop()"
          [attr.aria-label]="isCollapsed() ? 'Expandir menú' : 'Contraer menú'"
        >
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
        
        <div class="nav-item" (click)="navigateTo('/inventory')" [class.active]="isActive('/inventory')">
          <span class="nav-icon">📋</span>
          <span class="nav-text">Inventario</span>
        </div>
        
        <div *ngIf="isAdmin()" class="nav-item" (click)="navigateTo('/requests')" [class.active]="isActive('/requests')">
          <span class="nav-icon">✅</span>
          <span class="nav-text">Solicitudes</span>
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
  isMobileMenuOpen = this.sidebarService.isMobileMenuOpen;

  // Detectar si es desktop
  private isDesktopView = window.innerWidth >= 768;

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.isDesktopView = window.innerWidth >= 768;
    // Cerrar menú móvil si cambia a desktop
    if (this.isDesktopView && this.isMobileMenuOpen()) {
      this.closeMobileMenu();
    }
  }

  isDesktop(): boolean {
    return this.isDesktopView;
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  openMobileMenu(): void {
    this.sidebarService.openMobileMenu();
  }

  closeMobileMenu(): void {
    this.sidebarService.closeMobileMenu();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    // Cerrar menú móvil después de navegar
    if (!this.isDesktop()) {
      this.closeMobileMenu();
    }
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    // Cerrar menú móvil al cerrar sesión
    if (!this.isDesktop()) {
      this.closeMobileMenu();
    }
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