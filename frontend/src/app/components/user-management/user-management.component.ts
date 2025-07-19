import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'senior_admin';
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent {
  users: User[] = [];
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

  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private router = inject(Router);

  constructor() {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.apiService.getUsers().subscribe({
      next: (users: User[]) => {
        this.users = users.sort((a, b) => a.id - b.id); // Ordenar por ID ascendente
        this.applyFilters();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
        this.showMessage('Error al cargar usuarios', 'error');
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    // Aplicar búsqueda
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
    
    // Calcular paginación
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    this.currentPage = 1; // Reset a la primera página cuando se aplican filtros
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  getCurrentPageUsers(): User[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredUsers.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      // Mostrar todas las páginas si hay 5 o menos
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Mostrar páginas alrededor de la página actual
      let start = Math.max(1, this.currentPage - 2);
      let end = Math.min(this.totalPages, start + maxVisiblePages - 1);
      
      // Ajustar si estamos cerca del final
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

  isCurrentUser(user: User): boolean {
    const currentUser = this.authService.currentUserValue;
    return currentUser?.id === user.id;
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  private showMessage(message: string, type: string): void {
    this.message = message;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }
} 
