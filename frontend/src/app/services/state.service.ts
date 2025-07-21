import { Injectable, signal, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject } from 'rxjs';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'senior_admin';
}

export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: Date;
  autoClose?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StateService {
  // Signals principales
  private _user = signal<User | null>(null);
  private _isLoading = signal(false);
  private _notifications = signal<Notification[]>([]);

  // Signals computados
  public isAuthenticated = computed(() => this._user() !== null);
  public isAdmin = computed(() => this._user()?.role === 'admin' || this._user()?.role === 'senior_admin');
  public isSeniorAdmin = computed(() => this._user()?.role === 'senior_admin');
  public currentUser = this._user.asReadonly();
  public isLoading = this._isLoading.asReadonly();
  public notifications = this._notifications.asReadonly();

  // BehaviorSubjects para compatibilidad con código existente
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor() {
    // Sincronizar signals con BehaviorSubjects
    effect(() => {
      this.userSubject.next(this._user());
    });

    // Cargar usuario desde localStorage al inicializar
    this.loadUserFromStorage();
    
    // Verificar autenticación desde token
    this.checkAuthenticationFromToken();
  }

  // Métodos para manejar el usuario
  setUser(user: User | null): void {
    console.log('🔍 StateService - setUser called with:', user);
    this._user.set(user);
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
    console.log('🔍 StateService - _user signal updated:', this._user());
    console.log('🔍 StateService - isAuthenticated computed:', this.isAuthenticated());
  }

  clearUser(): void {
    this._user.set(null);
    localStorage.removeItem('currentUser');
  }

  // Métodos para manejar loading
  setLoading(loading: boolean): void {
    this._isLoading.set(loading);
  }

  // Métodos para manejar notificaciones
  addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): void {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date()
    };

    this._notifications.update(notifications => [...notifications, newNotification]);

    // Auto-close para notificaciones de éxito e info
    if (notification.autoClose !== false && (notification.type === 'success' || notification.type === 'info')) {
      setTimeout(() => {
        this.removeNotification(newNotification.id);
      }, 5000);
    }
  }

  removeNotification(id: string): void {
    this._notifications.update(notifications => 
      notifications.filter(n => n.id !== id)
    );
  }

  clearNotifications(): void {
    this._notifications.set([]);
  }

  // Métodos para manejar datos reactivos
  updateUserData(updates: Partial<User>): void {
    const currentUser = this._user();
    if (currentUser) {
      this._user.set({ ...currentUser, ...updates });
    }
  }

  // Métodos de utilidad
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private loadUserFromStorage(): void {
    const storedUser = localStorage.getItem('currentUser');
    console.log('🔍 StateService - loadUserFromStorage, storedUser:', storedUser);
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        console.log('🔍 StateService - parsed user:', user);
        this._user.set(user);
        console.log('🔍 StateService - user loaded, isAuthenticated:', this.isAuthenticated());
      } catch (error) {
        console.error('Error loading user from storage:', error);
        localStorage.removeItem('currentUser');
      }
    } else {
      console.log('🔍 StateService - no stored user found');
    }
  }

  // Método para sincronizar con AuthService (llamado externamente)
  public syncWithAuthService(authUser: User | null): void {
    if (authUser && !this._user()) {
      console.log('🔍 StateService - syncing with AuthService user:', authUser);
      this._user.set(authUser);
    }
  }

  // Método para verificar autenticación usando token directamente
  public checkAuthenticationFromToken(): void {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp && payload.exp > currentTime) {
          // Token válido, crear usuario si no existe
          if (!this._user()) {
            const user: User = {
              id: payload.id,
              username: payload.username,
              email: payload.email || '',
              role: payload.role
            };
            console.log('🔍 StateService - creating user from token:', user);
            this._user.set(user);
          }
        } else {
          // Token expirado, limpiar
          console.log('🔍 StateService - token expired, clearing user');
          this._user.set(null);
        }
      } catch (error) {
        console.error('Error parsing token:', error);
        this._user.set(null);
      }
    }
  }

  // Métodos para debugging
  getStateSnapshot(): AppState {
    return {
      user: this._user(),
      isAuthenticated: this.isAuthenticated(),
      isLoading: this._isLoading(),
      notifications: this._notifications()
    };
  }
} 