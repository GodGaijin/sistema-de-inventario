import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap, throwError, from } from 'rxjs';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { StateService } from '../services/state.service';
import { SessionConfirmationService } from '../services/session-confirmation.service';
import { Router } from '@angular/router';

// Función para verificar si el token está a 1 minuto de expirar
function isTokenExpiringSoon(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    const timeUntilExpiry = payload.exp - currentTime;
    return timeUntilExpiry <= 60 && timeUntilExpiry > 0; // Entre 0 y 60 segundos
  } catch (error) {
    return false;
  }
}

export const TokenInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const stateService = inject(StateService);
  const sessionConfirmationService = inject(SessionConfirmationService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si es un error 401 (Unauthorized), puede ser token expirado
      if (error.status === 401) {
        // Verificar si es un logout manual
        const isManualLogout = localStorage.getItem('manualLogout');
        if (isManualLogout) {
          // Es un logout manual, no mostrar mensajes de sesión inválida
          return throwError(() => error);
        }
        
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          // Verificar si el token está a punto de expirar (último minuto)
          if (accessToken && isTokenExpiringSoon(accessToken)) {
            // Mostrar popup de confirmación al usuario
            return from(sessionConfirmationService.showSessionConfirmation()).pipe(
              switchMap((userConfirmed) => {
                if (userConfirmed) {
                  // Usuario confirmó, intentar refresh
                  return authService.checkSession().pipe(
                    switchMap((response: any) => {
                      if (response.sessionExpired) {
                        // Refresh token también expirado, cerrar sesión
                        authService.logout();
                        router.navigate(['/login']);
                        return throwError(() => new Error('Session expired'));
                      } else {
                        // Refresh token válido, extender sesión
                        stateService.addNotification({
                          message: 'Sesión extendida exitosamente.',
                          type: 'success'
                        });
                        
                        // Reintentar la petición original con el nuevo token
                        const newToken = localStorage.getItem('accessToken');
                        if (newToken) {
                          const newRequest = request.clone({
                            setHeaders: {
                              Authorization: `Bearer ${newToken}`
                            }
                          });
                          return next(newRequest);
                        }
                      }
                      return throwError(() => error);
                    }),
                    catchError((sessionError) => {
                      // Error al verificar sesión, cerrar sesión
                      authService.logout();
                      router.navigate(['/login']);
                      return throwError(() => sessionError);
                    })
                  );
                } else {
                  // Usuario canceló o se agotó el tiempo, cerrar sesión
                  return throwError(() => new Error('User cancelled session refresh'));
                }
              }),
              catchError(() => {
                return throwError(() => error);
              })
            );
          } else {
            // Token ya expiró completamente, cerrar sesión directamente
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => error);
          }
        } else {
          // No hay refresh token, cerrar sesión
          authService.logout();
          router.navigate(['/login']);
        }
      }
      
      return throwError(() => error);
    })
  );
}; 