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
        const response = await this.apiService.post('/inventory/requests', this.requestForm.value).toPromise();
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

      // Hacer la petición para obtener el archivo Excel
      const response = await this.apiService.get(url).toPromise();
      
      // Crear blob y descargar el archivo
      const blob = new Blob([response], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
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
} 