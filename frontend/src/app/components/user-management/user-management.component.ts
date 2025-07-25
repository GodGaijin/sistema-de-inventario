import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SecurityService } from '../../services/security.service';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'senior_admin';
  // Propiedades de seguridad
  two_factor_enabled?: boolean;
  account_suspended?: boolean;
  suspension_reason?: string;
  suspension_date?: string;
  suspension_expires?: string;
  failed_login_attempts?: number;
  last_failed_login?: string;
  account_locked_until?: string;
  registration_ip?: string;
  last_login_ip?: string;
  last_login_timestamp?: string;
  created_at?: string;
  is_email_verified?: boolean;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css', './security-panel.css']
})
export class UserManagementComponent {
  users: any[] = [];
  filteredUsers: User[] = [];
  loading = false;
  message = '';
  messageType = '';
  
  // Paginación
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  
  // Búsqueda
  searchTerm = '';
  
  // Función Math para usar en el template
  Math = Math;

  blockedIPs: any[] = [];
  suspiciousActivity: any[] = [];
  newIP: string = '';
  ipReason: string = '';
  activityHours: number = 24;

  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private securityService = inject(SecurityService);

  constructor() {
    this.loadUsers();
    this.loadBlockedIPs();
    this.loadSuspiciousActivity();
  }

  ngOnInit() {
    this.loadUsers();
    this.loadBlockedIPs();
    this.loadSuspiciousActivity();
  }

  loadUsers(): void {
    this.loading = true;
    this.securityService.getUsersWithSecurityInfo().subscribe({
      next: (response: any) => {
        const users = response.users || response;
        if (Array.isArray(users)) {
          this.users = users.sort((a: any, b: any) => a.id - b.id);
        } else {
          this.users = [];
        }
        this.filteredUsers = [...this.users];
        this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
        this.currentPage = 1;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
        this.users = [];
        this.filteredUsers = [];
        this.totalPages = 1;
        this.currentPage = 1;
        this.loading = false;
        this.showMessage('Error al cargar usuarios', 'error');
      }
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      this.filteredUsers = this.users.filter(user =>
        user.username.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term) ||
        user.id.toString().includes(term)
      );
    } else {
      this.filteredUsers = [...this.users];
    }
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  getCurrentPageUsers(): User[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredUsers.slice(startIndex, endIndex);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, this.currentPage - 2);
      let end = Math.min(this.totalPages, start + maxVisiblePages - 1);
      if (end - start < maxVisiblePages - 1) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  }

  onRoleChange(userId: number, event: any): void {
    const newRole = event.target.value as 'user' | 'admin';
    this.updateUserRole(userId, newRole);
  }

  updateUserRole(userId: number, newRole: 'user' | 'admin'): void {
    this.apiService.updateUserRole(userId, newRole).subscribe({
      next: () => {
        this.showMessage('Rol actualizado exitosamente', 'success');
        this.loadUsers(); // Recargar la lista
      },
      error: (error: any) => {
        console.error('Error updating user role:', error);
        this.showMessage(error.error?.message || 'Error al actualizar rol', 'error');
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

  canChangeRole(user: User): boolean {
    // Solo se puede cambiar el rol de usuarios que no sean senior_admin
    return user.role !== 'senior_admin';
  }

  canManageUser(user: User): boolean {
    return this.authService.isSeniorAdmin() && user.role !== 'senior_admin';
  }

  canDeleteUser(user: User): boolean {
    // Solo se puede eliminar usuarios que no sean senior_admin y que no sea el usuario actual
    return user.role !== 'senior_admin' && !this.isCurrentUser(user);
  }

  isCurrentUser(user: User): boolean {
    const currentUser = this.authService.currentUserValue;
    return currentUser?.id === user.id;
  }

  getSuspendedUsersList(): any[] {
    return this.users.filter(user => user.account_suspended);
  }

  deleteUser(userId: number, username: string): void {
    if (confirm(`¿Estás seguro de que quieres eliminar al usuario "${username}"? Esta acción no se puede deshacer.`)) {
      this.apiService.deleteUser(userId).subscribe({
        next: () => {
          this.showMessage(`Usuario "${username}" eliminado exitosamente`, 'success');
          this.loadUsers(); // Recargar la lista
        },
        error: (error: any) => {
          console.error('Error deleting user:', error);
          this.showMessage(error.error?.message || 'Error al eliminar usuario', 'error');
        }
      });
    }
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  suspendUser(userId: number, username: string) {
    const reason = prompt(`Ingresa la razón para suspender al usuario "${username}":`);
    if (reason && reason.trim()) {
      this.securityService.suspendUser(userId, reason.trim()).subscribe({
        next: () => {
          this.showMessage(`Usuario "${username}" suspendido exitosamente. Se envió notificación por email.`, 'success');
          this.loadUsers();
        },
        error: (error: any) => {
          this.showMessage(error.error?.message || 'Error al suspender usuario', 'error');
        }
      });
    }
  }

  unsuspendUser(userId: number, username: string) {
    if (confirm(`¿Estás seguro de que quieres activar al usuario "${username}"?`)) {
      this.securityService.unsuspendUser(userId).subscribe({
        next: () => {
          this.showMessage(`Usuario "${username}" activado exitosamente. Se envió notificación por email.`, 'success');
          this.loadUsers();
        },
        error: (error: any) => {
          this.showMessage(error.error?.message || 'Error al activar usuario', 'error');
        }
      });
    }
  }

  viewSuspensionDetails(user: any) {
    const suspensionDate = user.suspension_date ? new Date(user.suspension_date).toLocaleString() : 'Fecha no disponible';
    let expirationDate = 'Suspensión permanente';
    let daysLeft = '';
    if (user.suspension_expires) {
      const expDate = new Date(user.suspension_expires);
      expirationDate = expDate.toLocaleString();
      if (user.suspension_date) {
        const susDate = new Date(user.suspension_date);
        const diffMs = expDate.getTime() - susDate.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays >= 1) {
          daysLeft = ` (Expira en ${diffDays} día${diffDays > 1 ? 's' : ''})`;
        }
      }
    }
    const details = `\nUsuario: ${user.username}\nEmail: ${user.email}\nRazón: ${user.suspension_reason || 'Sin razón especificada'}\nFecha de suspensión: ${suspensionDate}\nExpira: ${expirationDate}${daysLeft}\n    `;
    alert(details);
  }

  loadBlockedIPs() {
    this.securityService.getBlockedIPs().subscribe((data: any) => this.blockedIPs = data.blockedIPs || []);
  }



  loadSuspiciousActivity() {
    this.securityService.getSuspiciousActivity(this.activityHours).subscribe((data: any) => this.suspiciousActivity = data.suspiciousActivity || []);
  }

  // Métodos para estadísticas de seguridad
  getUsersWith2FA(): number {
    return this.users.filter(user => user.two_factor_enabled).length;
  }

  getSuspendedUsers(): number {
    return this.users.filter(user => user.account_suspended).length;
  }

  getUsersWithFailedAttempts(): number {
    return this.users.filter(user => user.failed_login_attempts > 0).length;
  }

  getRiskClass(riskScore: number): string {
    if (riskScore >= 8) return 'high-risk';
    if (riskScore >= 5) return 'medium-risk';
    return 'low-risk';
  }

  // Métodos para gestión de IPs
  blockIP(ip: string, reason: string) {
    if (!ip || !reason) {
      this.showMessage('Por favor ingresa una IP y razón válidas', 'error');
      return;
    }
    
    this.securityService.blockIP(ip, reason).subscribe({
      next: () => {
        this.showMessage(`IP ${ip} bloqueada exitosamente`, 'success');
        this.newIP = '';
        this.ipReason = '';
        this.loadBlockedIPs();
      },
      error: (error: any) => {
        this.showMessage(error.error?.message || 'Error al bloquear IP', 'error');
      }
    });
  }

  unblockIP(ip: string) {
    if (confirm(`¿Estás seguro de que quieres desbloquear la IP ${ip}?`)) {
      this.securityService.unblockIP(ip).subscribe({
        next: () => {
          this.showMessage(`IP ${ip} desbloqueada exitosamente`, 'success');
          this.loadBlockedIPs();
        },
        error: (error: any) => {
          this.showMessage(error.error?.message || 'Error al desbloquear IP', 'error');
        }
      });
    }
  }

  private showMessage(message: string, type: string): void {
    this.message = message;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }
} 
