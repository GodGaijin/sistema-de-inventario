import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const ErrorInterceptor: HttpInterceptorFn = (request, next) => {
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('HTTP Error:', error);
      
      // Manejar errores específicos
      if (error.status === 401) {
        // Aquí podrías redirigir al login si es necesario
      } else if (error.status === 403) {
        // Manejar permisos insuficientes
      } else if (error.status === 500) {
        // Error del servidor
      }
      
      // Retornar el error para que el componente lo maneje
      return throwError(() => error);
    })
  );
}; 