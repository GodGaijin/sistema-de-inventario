import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-commerce-data',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './commerce-data.component.html',
  styleUrls: ['./commerce-data.component.css']
})
export class CommerceDataComponent {
  commerceData: any = null;
  commerceForm: FormGroup;
  isAdmin = false;
  loading = false;
  editing = false;
  message = '';
  messageType = '';

  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  constructor() {
    this.commerceForm = this.fb.group({
      name: ['', Validators.required],
      rif: ['', Validators.required],
      location: ['', Validators.required],
      description: ['']
    });

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
    this.apiService.getCommerceData().subscribe({
      next: (data: any) => {
        this.commerceData = data;
        this.commerceForm.patchValue({
          name: data.name || '',
          rif: data.rif || '',
          location: data.location || '',
          description: data.description || ''
        });
        this.loading = false;
      },
      error: (error: any) => {
        this.showMessage('Error al cargar datos del comercio', 'error');
        this.loading = false;
      }
    });
  }

  startEdit(): void {
    this.editing = true;
  }

  cancelEdit(): void {
    this.editing = false;
    this.commerceForm.patchValue({
      name: this.commerceData.name || '',
      rif: this.commerceData.rif || '',
      location: this.commerceData.location || '',
      description: this.commerceData.description || ''
    });
  }

  saveData(): void {
    if (this.commerceForm.valid) {
      const data = this.commerceForm.value;
      this.apiService.updateCommerceData(data).subscribe({
        next: () => {
          this.showMessage('Datos actualizados exitosamente', 'success');
          this.editing = false;
          this.loadData();
        },
        error: (error: any) => {
          this.showMessage(error.error?.message || 'Error al actualizar datos', 'error');
        }
      });
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
