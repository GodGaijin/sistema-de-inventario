import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StateService } from './state.service';
import { environment } from '../../environments/environment';

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
  private apiUrl = environment.apiUrl;
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
      // Sincronizar con StateService
      this.stateService.syncWithAuthService(user);
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
        this.stateService.syncWithAuthService(response.user);
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

  resetPassword(code: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, {
      code,
      newPassword
    });
  }

  logout(): void {
    // Marcar que es un logout manual para evitar mensajes de sesión inválida
    localStorage.setItem('manualLogout', 'true');
    
    // Llamar al backend para invalidar la sesión
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/api/auth/logout`, { refreshToken }).subscribe({
        next: () => {
          console.log('✅ Sesión invalidada en el servidor');
        },
        error: (error) => {
          console.error('❌ Error al invalidar sesión:', error);
        }
      });
    }
    
    // Limpiar datos locales
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.stateService.clearUser();
    this.stateService.addNotification({
      message: 'Sesión cerrada exitosamente',
      type: 'info'
    });
    
    // Limpiar la bandera después de un breve delay
    setTimeout(() => {
      localStorage.removeItem('manualLogout');
    }, 1000);
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

  // Nuevo método para verificar si el usuario quiere continuar
  checkSession(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post(`${this.apiUrl}/auth/check-session`, {
      refreshToken
    }).pipe(
      map((response: any) => {
        if (!response.sessionExpired) {
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
          this.currentUserSubject.next(response.user);
          this.stateService.syncWithAuthService(response.user);
        }
        return response;
      })
    );
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;
    
    // Verificar si el token no ha expirado
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp && payload.exp < currentTime) {
        // Token expirado, pero no limpiar automáticamente
        // El interceptor se encargará de mostrar el mensaje
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      this.logout();
      return false;
    }
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