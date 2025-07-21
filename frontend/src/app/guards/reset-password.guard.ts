import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ResetPasswordGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Verificar si hay parámetros de redirección en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    const code = urlParams.get('code');

    // Si hay parámetros de redirección, manejarlos
    if (redirect === 'reset-password') {
      if (code) {
        // Redirigir a reset-password con el código
        this.router.navigate(['/reset-password'], { 
          queryParams: { code: code },
          replaceUrl: true 
        });
      } else {
        // Redirigir a reset-password sin código
        this.router.navigate(['/reset-password'], { replaceUrl: true });
      }
      return false;
    }

    // Permitir acceso a reset-password independientemente del estado de autenticación
    // Esto permite que usuarios autenticados también puedan resetear su contraseña
    return true;
  }
} 