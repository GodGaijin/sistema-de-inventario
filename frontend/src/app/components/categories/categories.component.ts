import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css']
})
export class CategoriesComponent {
  categories: any[] = [];
  categoryForm: FormGroup;
  editingCategory: any = null;
  isAdmin = false;
  isUser = false;
  loading = false;
  message = '';
  messageType = '';
  searchTerm: string = '';
  filteredCategories: any[] = [];

  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  constructor() {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.isUser = this.authService.currentUserValue?.role === 'user';
    this.loadData();
    
    this.authService.currentUser.subscribe(user => {
      this.isAdmin = this.authService.isAdmin();
      this.isUser = user?.role === 'user';
    });
  }

  loadData(): void {
    this.loading = true;
    this.apiService.getCategories().subscribe({
      next: (data: any[]) => {
        this.categories = data;
        this.filterCategories();
        this.loading = false;
      },
      error: (error: any) => {
        this.showMessage('Error al cargar categorías', 'error');
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.categoryForm.valid) {
      const categoryData = this.categoryForm.value;
      
      if (this.editingCategory) {
        this.apiService.updateCategory(this.editingCategory.id, categoryData).subscribe({
          next: () => {
            this.showMessage('Categoría actualizada exitosamente', 'success');
            this.resetForm();
            this.loadData();
          },
          error: (error: any) => {
            console.error('Error updating category:', error);
            const errorMessage = error.error?.message || error.message || 'Error al actualizar categoría';
            this.showMessage(errorMessage, 'error');
          }
        });
      } else {
        this.apiService.createCategory(categoryData).subscribe({
          next: (response: any) => {
            this.showMessage('Categoría creada exitosamente', 'success');
            this.resetForm();
            this.loadData();
          },
          error: (error: any) => {
            const errorMessage = error.error?.message || error.message || 'Error al crear categoría';
            this.showMessage(errorMessage, 'error');
          }
        });
      }
    }
  }

  editCategory(category: any): void {
    this.editingCategory = category;
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description
    });
  }

  deleteCategory(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      this.apiService.deleteCategory(id).subscribe({
        next: () => {
          this.showMessage('Categoría eliminada exitosamente', 'success');
          this.loadData();
        },
        error: (error: any) => {
          this.showMessage(error.error?.message || 'Error al eliminar categoría', 'error');
        }
      });
    }
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.categoryForm.reset();
    this.editingCategory = null;
  }

  async downloadPDF(): Promise<void> {
    try {
      // Importación dinámica de jsPDF
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('Lista de Categorías', 14, 22);
      
      const tableData = this.categories.map(category => [
        category.name,
        category.description
      ]);

      // Importación dinámica de autoTable
      const autoTable = (await import('jspdf-autotable')).default;
      autoTable(doc, {
        head: [['Nombre', 'Descripción']],
        body: tableData,
        startY: 30,
        styles: {
          fontSize: 10,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [102, 126, 234],
          textColor: 255
        }
      });

      doc.save('categorias.pdf');
      this.showMessage('PDF descargado exitosamente', 'success');
    } catch (error: any) {
      console.error('Error al generar PDF:', error);
      this.showMessage('Error al generar el PDF: ' + (error.message || 'Error desconocido'), 'error');
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

  filterCategories(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredCategories = this.categories.filter(category =>
      category.name.toLowerCase().includes(term) ||
      category.description.toLowerCase().includes(term)
    );
  }
} 
