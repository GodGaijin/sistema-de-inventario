import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalDistributors: number;
  activeUsers: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home-container">
      <div class="welcome-section">
        <h1>¡Bienvenido, {{ currentUser()?.username }}!</h1>
        <p class="subtitle">Panel de control del Sistema de Inventario</p>
      </div>

      <div class="stats-grid">
        <div *ngIf="isSeniorAdmin()" class="stat-card users">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <h3>Usuarios Registrados</h3>
            <div class="stat-number">{{ stats().totalUsers }}</div>
            <div class="stat-detail">Usuarios en el sistema</div>
          </div>
        </div>

        <div class="stat-card products">
          <div class="stat-icon">📦</div>
          <div class="stat-content">
            <h3>Productos Registrados</h3>
            <div class="stat-number">{{ stats().totalProducts }}</div>
            <div class="stat-detail">Productos en inventario</div>
          </div>
        </div>

        <div class="stat-card distributors">
          <div class="stat-icon">🏢</div>
          <div class="stat-content">
            <h3>Distribuidores</h3>
            <div class="stat-number">{{ stats().totalDistributors }}</div>
            <div class="stat-detail">Proveedores registrados</div>
          </div>
        </div>

        <div class="stat-card active">
          <div class="stat-icon">🟢</div>
          <div class="stat-content">
            <h3>Usuarios Activos</h3>
            <div class="stat-number">{{ stats().activeUsers }}</div>
            <div class="stat-detail">Conectados ahora</div>
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div class="actions-grid">
          <div class="action-card" (click)="navigateTo('/products')">
            <div class="action-icon">➕</div>
            <h4>Agregar Producto</h4>
            <p>Registrar nuevo producto en el inventario</p>
          </div>

          <div class="action-card" (click)="navigateTo('/categories')">
            <div class="action-icon">📂</div>
            <h4>Gestionar Categorías</h4>
            <p>Organizar productos por categorías</p>
          </div>

          <div class="action-card" (click)="navigateTo('/distributors')">
            <div class="action-icon">🏢</div>
            <h4>Ver Distribuidores</h4>
            <p>Gestionar proveedores y distribuidores</p>
          </div>

          <div *ngIf="isAdmin()" class="action-card" (click)="navigateTo('/audits')">
            <div class="action-icon">📊</div>
            <h4>Ver Auditoría</h4>
            <p>Revisar actividades del sistema</p>
          </div>
        </div>
      </div>

      <div class="system-info">
        <h2>Información del Sistema</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Rol:</span>
            <span class="info-value">{{ getRoleText() }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Última actualización:</span>
            <span class="info-value">{{ lastUpdate() | date:'medium' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Estado:</span>
            <span class="info-value status-online">🟢 En línea</span>
          </div>
        </div>

        <!-- Usuarios Conectados -->
        <div *ngIf="isAdmin() || isSeniorAdmin()" class="active-users-section">
          <h3>Usuarios Conectados ({{ activeUsersCount }})</h3>
          
          <div class="loading-spinner" *ngIf="loadingActiveUsers">
            <div class="spinner"></div>
            <span>Cargando usuarios activos...</span>
          </div>
          
          <!-- Tabla de Usuarios Conectados -->
          <div class="active-users-table" *ngIf="!loadingActiveUsers && activeUsers.length > 0">
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of activeUsers">
                  <td>{{ user.username }}</td>
                  <td>
                    <span class="role-badge" [ngClass]="user.role">
                      {{ getRoleDisplayName(user.role) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="no-active-users" *ngIf="!loadingActiveUsers && activeUsers.length === 0">
            <p>No hay usuarios conectados actualmente.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private apiService = inject(ApiService);
  private stateService = inject(StateService);
  private router = inject(Router);

  // Signals reactivos
  currentUser = this.stateService.currentUser;
  isAdmin = this.stateService.isAdmin;
  isSeniorAdmin = this.stateService.isSeniorAdmin;
  
  // Estadísticas del dashboard
  stats = signal<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalDistributors: 0,
    activeUsers: 0
  });

  lastUpdate = signal(new Date());

  // Información de usuarios activos
  activeUsers: any[] = [];
  activeUsersCount = 0;
  loadingActiveUsers = false;

  ngOnInit(): void {
    this.loadDashboardStats();
    this.loadActiveUsers();
    // Actualizar estadísticas cada 30 segundos
    setInterval(() => {
      this.loadDashboardStats();
    }, 30000);
  }

  loadDashboardStats(): void {
    // Cargar estadísticas desde el backend usando Observables
    this.apiService.getUsers().subscribe({
      next: (users) => {
        this.stats.update(current => ({ ...current, totalUsers: users.length }));
      },
      error: (error) => {}
    });

    this.apiService.getProducts().subscribe({
      next: (products) => {
        this.stats.update(current => ({ ...current, totalProducts: products.length }));
      },
      error: (error) => {}
    });

    this.apiService.getDistributors().subscribe({
      next: (distributors) => {
        this.stats.update(current => ({ ...current, totalDistributors: distributors.length }));
      },
      error: (error) => {}
    });

    // Obtener usuarios activos reales desde la base de datos
    this.apiService.getActiveUsersStats().subscribe({
      next: (stats) => {
        this.stats.update(current => ({ 
          ...current, 
          activeUsers: stats.activeUsersCount || 0 
        }));
      },
      error: (error) => {
        // Fallback a 0 si hay error
        this.stats.update(current => ({ 
          ...current, 
          activeUsers: 0 
        }));
      }
    });

    this.lastUpdate.set(new Date());
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  loadActiveUsers(): void {
    // Solo cargar si es admin o senior admin
    const isAdminUser = this.isAdmin();
    const isSeniorAdminUser = this.isSeniorAdmin();
    
    if (isAdminUser || isSeniorAdminUser) {
      this.loadingActiveUsers = true;
      this.apiService.getActiveUsersWithRoles().subscribe({
        next: (data) => {
          this.activeUsers = data.activeUsers || [];
          this.activeUsersCount = data.activeUsersCount || 0;
          this.loadingActiveUsers = false;
        },
        error: (error) => {
          this.loadingActiveUsers = false;
        }
      });
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