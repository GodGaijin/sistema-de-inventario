import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent {
  products: any[] = [];
  categories: any[] = [];
  distributors: any[] = [];
  productForm: FormGroup;
  editingProduct: any = null;
  isAdmin = false;
  isUser = false;
  loading = false;
  message = '';
  messageType = '';
  searchTerm: string = '';
  filteredProducts: any[] = [];

  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  constructor() {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      category_id: ['', Validators.required],
      distributor_id: ['', Validators.required]
    });

    // Obtener estado de admin inmediatamente
    this.isAdmin = this.authService.isAdmin();
    this.isUser = this.authService.currentUserValue?.role === 'user';
    this.loadData();
    
    // Suscribirse a cambios del usuario para actualizar estado de admin y user
    this.authService.currentUser.subscribe(user => {
      this.isAdmin = this.authService.isAdmin();
      this.isUser = user?.role === 'user';
    });
  }

  loadData(): void {
    this.loading = true;
    
    // Load products
    this.apiService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.filterProducts();
        this.loading = false;
      },
      error: (error) => {
        this.showMessage('Error al cargar productos', 'error');
        this.loading = false;
      }
    });

    // Load categories
    this.apiService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (error) => {
        this.showMessage('Error al cargar categorías', 'error');
      }
    });

    // Load distributors
    this.apiService.getDistributors().subscribe({
      next: (data) => {
        this.distributors = data;
      },
      error: (error) => {
        this.showMessage('Error al cargar distribuidores', 'error');
      }
    });
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      const productData = this.productForm.value;
      
      if (this.editingProduct) {
        // Update existing product
        this.apiService.updateProduct(this.editingProduct.id, productData).subscribe({
          next: () => {
            this.showMessage('Producto actualizado exitosamente', 'success');
            this.resetForm();
            this.loadData();
          },
          error: (error) => {
            this.showMessage(error.error?.message || 'Error al actualizar producto', 'error');
          }
        });
      } else {
        // Create new product
        this.apiService.createProduct(productData).subscribe({
          next: () => {
            this.showMessage('Producto creado exitosamente', 'success');
            this.resetForm();
            this.loadData();
          },
          error: (error) => {
            this.showMessage(error.error?.message || 'Error al crear producto', 'error');
          }
        });
      }
    }
  }

  editProduct(product: any): void {
    this.editingProduct = product;
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category_id: product.category_id,
      distributor_id: product.distributor_id
    });
  }

  deleteProduct(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      this.apiService.deleteProduct(id).subscribe({
        next: () => {
          this.showMessage('Producto eliminado exitosamente', 'success');
          this.loadData();
        },
        error: (error) => {
          this.showMessage(error.error?.message || 'Error al eliminar producto', 'error');
        }
      });
    }
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.productForm.reset();
    this.editingProduct = null;
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'N/A';
  }

  getDistributorName(distributorId: number): string {
    const distributor = this.distributors.find(d => d.id === distributorId);
    return distributor ? distributor.name : 'N/A';
  }

  formatPrice(price: any): string {
    if (price === null || price === undefined || isNaN(Number(price))) {
      return '0.00 Bs';
    }
    return `${Number(price).toFixed(2)} Bs`;
  }

  async downloadPDF(): Promise<void> {
    try {
      console.log('Iniciando descarga de PDF...');
      
      // Importación dinámica de jsPDF
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text('Lista de Productos', 14, 22);
      
      // Table data
      const tableData = this.products.map(product => [
        product.name,
        product.description,
        this.formatPrice(product.price),
        product.stock,
        this.getCategoryName(product.category_id),
        this.getDistributorName(product.distributor_id)
      ]);

      console.log('Datos de la tabla:', tableData);

      // Importación dinámica de autoTable
      const autoTable = (await import('jspdf-autotable')).default;
      autoTable(doc, {
        head: [['Nombre', 'Descripción', 'Precio', 'Stock', 'Categoría', 'Distribuidor']],
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

      // Save PDF
      doc.save('productos.pdf');
      console.log('PDF generado exitosamente');
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

  filterProducts(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(product =>
      product.name.toLowerCase().includes(term) ||
      product.description.toLowerCase().includes(term) ||
      this.getCategoryName(product.category_id).toLowerCase().includes(term) ||
      this.getDistributorName(product.distributor_id).toLowerCase().includes(term)
    );
  }
} 
