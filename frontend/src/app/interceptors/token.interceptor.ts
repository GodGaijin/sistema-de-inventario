import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap, throwError, from } from 'rxjs';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { StateService } from '../services/state.service';
import { SessionConfirmationService } from '../services/session-confirmation.service';
import { Router } from '@angular/router';

// Función para verificar si el token está a 5 minutos de expirar
function isTokenExpiringSoon(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    const timeUntilExpiry = payload.exp - currentTime;
    return timeUntilExpiry <= 300 && timeUntilExpiry > 0; // Entre 0 y 5 minutos
  } catch (error) {
    return false;
  }
}

// Función para verificar si el token ha expirado
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
}

export const TokenInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const stateService = inject(StateService);
  const sessionConfirmationService = inject(SessionConfirmationService);
  const router = inject(Router);

  // Obtener el token del localStorage
  const token = localStorage.getItem('accessToken');
  
  // Si hay token y la URL no es de login/registro, agregar el header de autorización
  if (token && !request.url.includes('/auth/login') && !request.url.includes('/auth/register')) {
    // Verificar si el token está expirado
    if (isTokenExpired(token)) {
      // Token expirado, intentar renovar automáticamente
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        return authService.refreshToken().pipe(
          switchMap((response: any) => {
            // Token renovado exitosamente, continuar con la petición original
            const newRequest = request.clone({
              setHeaders: {
                Authorization: `Bearer ${response.accessToken}`
              }
            });
            return next(newRequest);
          }),
          catchError((refreshError) => {
            // Error al renovar token, cerrar sesión
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      } else {
        // No hay refresh token, cerrar sesión
        authService.logout();
        router.navigate(['/login']);
        return throwError(() => new Error('No refresh token available'));
      }
    } else {
      // Token válido, agregar header de autorización
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si es un error 401 (Unauthorized), intentar renovar el token
      if (error.status === 401) {
        // Verificar si es un logout manual
        const isManualLogout = localStorage.getItem('manualLogout');
        if (isManualLogout) {
          return throwError(() => error);
        }
        
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // Intentar renovar el token automáticamente
          return authService.refreshToken().pipe(
            switchMap((response: any) => {
              // Token renovado exitosamente, reintentar la petición original
              const newRequest = request.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.accessToken}`
                }
              });
              return next(newRequest);
            }),
            catchError((refreshError) => {
              // Error al renovar token, cerrar sesión
              authService.logout();
              router.navigate(['/login']);
              return throwError(() => refreshError);
            })
          );
        } else {
          // No hay refresh token, cerrar sesión
          authService.logout();
          router.navigate(['/login']);
          return throwError(() => error);
        }
      }
      
      return throwError(() => error);
    })
  );
}; 