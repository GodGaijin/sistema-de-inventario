import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { StateService } from '../services/state.service';
import { Router } from '@angular/router';

export const TokenInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const stateService = inject(StateService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si es un error 401 (Unauthorized), puede ser token expirado
      if (error.status === 401) {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          // Intentar verificar la sesión con el refresh token
          return authService.checkSession().pipe(
            switchMap((response: any) => {
              if (response.sessionExpired) {
                // Refresh token también expirado, cerrar sesión
                authService.logout();
                router.navigate(['/login']);
                stateService.addNotification({
                  message: 'Sesión expirada. Por favor, inicie sesión nuevamente.',
                  type: 'warning'
                });
                return throwError(() => new Error('Session expired'));
              } else {
                // Refresh token válido, mostrar mensaje de confirmación
                stateService.addNotification({
                  message: '¿Sigues ahí? Tu sesión se ha extendido automáticamente.',
                  type: 'info'
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
              stateService.addNotification({
                message: 'Error de sesión. Por favor, inicie sesión nuevamente.',
                type: 'error'
              });
              return throwError(() => sessionError);
            })
          );
        } else {
          // No hay refresh token, cerrar sesión
          authService.logout();
          router.navigate(['/login']);
          stateService.addNotification({
            message: 'Sesión no válida. Por favor, inicie sesión nuevamente.',
            type: 'warning'
          });
        }
      }
      
      return throwError(() => error);
    })
  );
}; 