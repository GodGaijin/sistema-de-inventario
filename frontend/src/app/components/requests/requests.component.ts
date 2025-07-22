import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { StateService } from '../../services/state.service';

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
  admin_name?: string;
  processed_at?: string;
}

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.css']
})
export class RequestsComponent implements OnInit {
  activeTab: 'pending' | 'history' = 'pending';
  pendingRequests: InventoryRequest[] = [];
  requestHistory: InventoryRequest[] = [];
  
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
    this.rejectionForm = this.fb.group({
      rejection_reason: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadPendingRequests();
    this.loadRequestHistory();
  }

  async loadPendingRequests() {
    try {
      const response = await this.apiService.get('/inventory/requests/pending').toPromise();
      if (response?.success) {
        this.pendingRequests = response.data;
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  }

  async loadRequestHistory() {
    try {
      const response = await this.apiService.get('/inventory/requests/history').toPromise();
      if (response?.success) {
        this.requestHistory = response.data;
      }
    } catch (error) {
      console.error('Error loading request history:', error);
    }
  }

  async approveRequest(requestId: number) {
    try {
      const response = await this.apiService.put(`/inventory/requests/${requestId}/approve`, {}).toPromise();
      if (response?.success) {
        this.loadPendingRequests();
        this.loadRequestHistory();
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
          this.loadPendingRequests();
          this.loadRequestHistory();
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

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPendingCount(): number {
    return this.pendingRequests.length;
  }

  getHistoryCount(): number {
    return this.requestHistory.length;
  }
} 