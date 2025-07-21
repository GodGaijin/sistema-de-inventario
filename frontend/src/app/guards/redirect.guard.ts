import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RedirectGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    // Verificar si hay un token válido
    if (this.authService.isAuthenticated()) {
      // Si hay token válido, redirigir al dashboard
      this.router.navigate(['/dashboard']);
      return false; // No activar la ruta actual
    } else {
      // Si no hay token, permitir ir al login
      return true;
    }
  }
} 