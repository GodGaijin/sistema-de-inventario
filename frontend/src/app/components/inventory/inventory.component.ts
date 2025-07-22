import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { StateService } from '../../services/state.service';

interface Product {
  id: number;
  name: string;
  codigo_seniat?: string;
  stock: number;
}

interface InventoryRequest {
  id: number;
  product_id: number;
  product_name: string;
  product_code: string;
  current_stock: number;
  transaction_type: 'entrada' | 'salida' | 'auto_consumo';
  quantity: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  user_name: string;
  created_at: string;
  rejection_reason?: string;
}

interface InventoryTransaction {
  id: number;
  codigo_de_transaccion: string;
  fecha: string;
  codigo_prod: string;
  nombre: string;
  inventario_inicial: number;
  entradas: number;
  salidas: number;
  auto_consumo: number;
  inventario_final: number;
  user_name: string;
  request_status?: string;
  rejection_reason?: string;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryComponent implements OnInit {
  activeTab: 'requests' | 'transactions' | 'history' = 'requests';
  products: Product[] = [];
  userRequests: InventoryRequest[] = [];
  allTransactions: InventoryTransaction[] = [];
  userTransactions: InventoryTransaction[] = [];
  stats: any = {};
  
  // Códigos SENIAT para inventario
  seniatCodes = [
    { code: '053', description: 'Servicios generales' },
    { code: '057', description: 'Arrendamiento de inmuebles' },
    { code: '061', description: 'Arrendamiento de bienes muebles' },
    { code: '071', description: 'Fletes nacionales' },
    { code: '083', description: 'Publicidad y propaganda' },
    { code: 'Otro', description: 'Especificar código' }
  ];
  
  requestForm: FormGroup;
  rejectionForm: FormGroup;
  selectedRequest: InventoryRequest | null = null;
  
  loading = false;
  showRejectionModal = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private stateService: StateService,
    private fb: FormBuilder
  ) {
    this.requestForm = this.fb.group({
      product_id: ['', Validators.required],
      codigo_prod: ['', Validators.required],
      codigo_prod_otro: [''],
      transaction_type: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      description: [''] // Ahora opcional
    });

    this.rejectionForm = this.fb.group({
      rejection_reason: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadUserRequests();
    this.loadTransactions();
    this.loadStats();
  }

  async loadProducts() {
    try {
      const response = await this.apiService.getProducts().toPromise();
      if (response) {
        this.products = response;
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }

  async loadUserRequests() {
    try {
      const response = await this.apiService.get('/inventory/requests/user').toPromise();
      if (response?.success) {
        this.userRequests = response.data;
      }
    } catch (error) {
      console.error('Error loading user requests:', error);
    }
  }

  async loadTransactions() {
    try {
      const [allResponse, userResponse] = await Promise.all([
        this.apiService.get('/inventory/transactions').toPromise(),
        this.apiService.get('/inventory/transactions/user').toPromise()
      ]);

      if (allResponse?.success) {
        this.allTransactions = allResponse.data;
      }
      if (userResponse?.success) {
        this.userTransactions = userResponse.data;
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }

  async loadStats() {
    try {
      const response = await this.apiService.get('/inventory/stats').toPromise();
      if (response?.success) {
        this.stats = response.data;
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async createRequest() {
    if (this.requestForm.valid) {
      this.loading = true;
      try {
        const formData = { ...this.requestForm.value };
        
        // Si se seleccionó "otro", usar el valor del campo codigo_prod_otro
        if (formData.codigo_prod === 'otro') {
          formData.codigo_prod = formData.codigo_prod_otro;
        }
        
        // Eliminar el campo temporal
        delete formData.codigo_prod_otro;
        
        const response = await this.apiService.post('/inventory/requests', formData).toPromise();
        if (response?.success) {
          this.requestForm.reset();
          this.loadUserRequests();
          this.stateService.showSuccess('Solicitud creada exitosamente');
        }
      } catch (error: any) {
        this.stateService.showError(error.error?.message || 'Error al crear la solicitud');
      } finally {
        this.loading = false;
      }
    }
  }

  async approveRequest(requestId: number) {
    try {
      const response = await this.apiService.put(`/inventory/requests/${requestId}/approve`, {}).toPromise();
      if (response?.success) {
        this.loadUserRequests();
        this.loadTransactions();
        this.loadStats();
        this.stateService.showSuccess('Solicitud aprobada exitosamente');
      }
    } catch (error: any) {
      this.stateService.showError(error.error?.message || 'Error al aprobar la solicitud');
    }
  }

  openRejectionModal(request: InventoryRequest) {
    this.selectedRequest = request;
    this.showRejectionModal = true;
    this.rejectionForm.reset();
  }

  async rejectRequest() {
    if (this.rejectionForm.valid && this.selectedRequest) {
      try {
        const response = await this.apiService.put(
          `/inventory/requests/${this.selectedRequest.id}/reject`, 
          this.rejectionForm.value
        ).toPromise();
        
        if (response?.success) {
          this.showRejectionModal = false;
          this.selectedRequest = null;
          this.loadUserRequests();
          this.stateService.showSuccess('Solicitud rechazada exitosamente');
        }
      } catch (error: any) {
        this.stateService.showError(error.error?.message || 'Error al rechazar la solicitud');
      }
    }
  }

  closeRejectionModal() {
    this.showRejectionModal = false;
    this.selectedRequest = null;
    this.rejectionForm.reset();
  }

  async exportTransactions() {
    try {
      this.loading = true;
      
      // Crear URL con parámetros de fecha si están disponibles
      let url = '/inventory/export';
      const params = new URLSearchParams();
      
      // Aquí podrías agregar filtros de fecha si los implementas
      // params.append('startDate', startDate);
      // params.append('endDate', endDate);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }

      // Obtener el token de autenticación
      const token = this.authService.getToken();
      
      // Hacer la petición usando fetch para manejar archivos binarios
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Obtener el blob del archivo
      const blob = await response.blob();
      
      // Crear URL del blob y descargar el archivo
      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      link.download = `inventario_transacciones_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);
      
      this.stateService.showSuccess('Archivo Excel descargado exitosamente');
    } catch (error: any) {
      console.error('Error exporting transactions:', error);
      this.stateService.showError('Error al exportar transacciones');
    } finally {
      this.loading = false;
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'approved': return 'badge-success';
      case 'rejected': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'approved': return 'Aprobada';
      case 'rejected': return 'Rechazada';
      default: return 'Desconocido';
    }
  }

  getTransactionTypeText(type: string): string {
    switch (type) {
      case 'entrada': return 'Entrada';
      case 'salida': return 'Salida';
      case 'auto_consumo': return 'Auto-consumo';
      default: return type;
    }
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Verificar si se debe mostrar el campo "otro"
  showOtherCodeField(): boolean {
    return this.requestForm.get('codigo_prod')?.value === 'otro';
  }

  // Validar el formulario considerando el campo "otro"
  isFormValid(): boolean {
    const form = this.requestForm;
    const codigoProd = form.get('codigo_prod')?.value;
    const codigoProdOtro = form.get('codigo_prod_otro')?.value;
    
    // Si se seleccionó "otro", el campo otro debe estar lleno
    if (codigoProd === 'otro' && !codigoProdOtro) {
      return false;
    }
    
    return form.valid;
  }
} 