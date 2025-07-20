import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'senior_admin';
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // User Management (Admin Senior only)
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/auth/users`, { headers: this.getHeaders() });
  }

  updateUserRole(userId: number, newRole: 'user' | 'admin'): Observable<any> {
    return this.http.put(`${this.apiUrl}/auth/users/${userId}/role`, 
      { userId, newRole }, 
      { headers: this.getHeaders() }
    );
  }

  // Products
  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products`, { headers: this.getHeaders() });
  }

  createProduct(product: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/products`, product, { headers: this.getHeaders() });
  }

  updateProduct(id: number, product: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/products/${id}`, product, { headers: this.getHeaders() });
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${id}`, { headers: this.getHeaders() });
  }

  // Categories
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categories`, { headers: this.getHeaders() });
  }

  createCategory(category: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/categories`, category, { headers: this.getHeaders() });
  }

  updateCategory(id: number, category: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/categories/${id}`, category, { headers: this.getHeaders() });
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/categories/${id}`, { headers: this.getHeaders() });
  }

  // Distributors
  getDistributors(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/distributors`, { headers: this.getHeaders() });
  }

  createDistributor(distributor: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/distributors`, distributor, { headers: this.getHeaders() });
  }

  updateDistributor(id: number, distributor: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/distributors/${id}`, distributor, { headers: this.getHeaders() });
  }

  deleteDistributor(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/distributors/${id}`, { headers: this.getHeaders() });
  }

  // Audits
  getAudits(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/audits`, { headers: this.getHeaders() });
  }

  // Commerce Data
  getCommerceData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/own-commerce`, { headers: this.getHeaders() });
  }

  updateCommerceData(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/own-commerce`, data, { headers: this.getHeaders() });
  }




} 