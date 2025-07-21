import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-distributors',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './distributors.component.html',
  styleUrls: ['./distributors.component.css']
})
export class DistributorsComponent {
  distributors: any[] = [];
  distributorForm: FormGroup;
  editingDistributor: any = null;
  isAdmin = false;
  isUser = false;
  loading = false;
  message = '';
  messageType = '';
  searchTerm: string = '';
  filteredDistributors: any[] = [];

  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  constructor() {
    this.distributorForm = this.fb.group({
      name: ['', Validators.required],
      contact: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      rif: ['', Validators.required],
      location: ['', Validators.required]
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
    this.apiService.getDistributors().subscribe({
      next: (data: any[]) => {
        this.distributors = data;
        this.filterDistributors();
        this.loading = false;
      },
      error: (error: any) => {
        this.showMessage('Error al cargar distribuidores', 'error');
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.distributorForm.valid) {
      const distributorData = this.distributorForm.value;
      
      if (this.editingDistributor) {
        this.apiService.updateDistributor(this.editingDistributor.id, distributorData).subscribe({
          next: () => {
            this.showMessage('Distribuidor actualizado exitosamente', 'success');
            this.resetForm();
            this.loadData();
          },
          error: (error: any) => {
            this.showMessage(error.error?.message || 'Error al actualizar distribuidor', 'error');
          }
        });
      } else {
        this.apiService.createDistributor(distributorData).subscribe({
          next: () => {
            this.showMessage('Distribuidor creado exitosamente', 'success');
            this.resetForm();
            this.loadData();
          },
          error: (error: any) => {
            this.showMessage(error.error?.message || 'Error al crear distribuidor', 'error');
          }
        });
      }
    }
  }

  editDistributor(distributor: any): void {
    this.editingDistributor = distributor;
    this.distributorForm.patchValue({
      name: distributor.name,
      contact: distributor.contact,
      phone: distributor.phone,
      email: distributor.email,
      rif: distributor.rif,
      location: distributor.location
    });
  }

  deleteDistributor(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar este distribuidor?')) {
      this.apiService.deleteDistributor(id).subscribe({
        next: () => {
          this.showMessage('Distribuidor eliminado exitosamente', 'success');
          this.loadData();
        },
        error: (error: any) => {
          this.showMessage(error.error?.message || 'Error al eliminar distribuidor', 'error');
        }
      });
    }
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.distributorForm.reset();
    this.editingDistributor = null;
  }

  async downloadPDF(): Promise<void> {
    try {
      // Importación dinámica de jsPDF
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('Lista de Distribuidores', 14, 22);
      
      const tableData = this.distributors.map(distributor => [
        distributor.name,
        distributor.contact,
        distributor.phone,
        distributor.email,
        distributor.rif,
        distributor.location
      ]);

      // Importación dinámica de autoTable
      const autoTable = (await import('jspdf-autotable')).default;
      autoTable(doc, {
        head: [['Nombre', 'Contacto', 'Teléfono', 'Email', 'RIF', 'Ubicación']],
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

      doc.save('distribuidores.pdf');
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

  filterDistributors(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredDistributors = this.distributors.filter(distributor =>
      distributor.name.toLowerCase().includes(term) ||
      distributor.contact.toLowerCase().includes(term) ||
      distributor.phone.toLowerCase().includes(term) ||
      distributor.email.toLowerCase().includes(term) ||
      distributor.rif.toLowerCase().includes(term) ||
      distributor.location.toLowerCase().includes(term)
    );
  }
} 
