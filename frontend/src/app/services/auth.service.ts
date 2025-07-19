import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StateService } from './state.service';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'senior_admin';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3001/api';
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private stateService = inject(StateService);

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<User | null>(
      this.getUserFromToken()
    );
    this.currentUser = this.currentUserSubject.asObservable();
    
    // Inicializar usuario desde token si existe
    this.initializeUser();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  private initializeUser(): void {
    const user = this.getUserFromToken();
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, {
      username,
      password
    }).pipe(
      map(response => {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        this.currentUserSubject.next(response.user);
        this.stateService.setUser(response.user);
        this.stateService.addNotification({
          message: `Bienvenido, ${response.user.username}!`,
          type: 'success'
        });
        return response;
      })
    );
  }

  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, {
      username,
      email,
      password
    });
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, {
      email
    });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, {
      token,
      newPassword
    });
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.currentUserSubject.next(null);
    this.stateService.clearUser();
    this.stateService.addNotification({
      message: 'Sesión cerrada exitosamente',
      type: 'info'
    });
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/refresh`, {
      refreshToken
    }).pipe(
      map(response => {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        return response;
      })
    );
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  isAdmin(): boolean {
    const user = this.currentUserValue;
    return user?.role === 'admin' || user?.role === 'senior_admin';
  }

  isSeniorAdmin(): boolean {
    const user = this.currentUserValue;
    return user?.role === 'senior_admin';
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private getUserFromToken(): User | null {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user = {
        id: payload.id,
        username: payload.username,
        email: payload.email || '',
        role: payload.role
      };
      return user;
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  }

  validatePassword(password: string): boolean {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;
    return passwordRegex.test(password);
  }
} 