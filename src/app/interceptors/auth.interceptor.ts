// src/app/interceptors/auth.interceptor.ts

import { HttpInterceptorFn, HttpErrorResponse  } from '@angular/common/http';
import { inject } from '@angular/core';
import { AutenticacionService } from '../services/autenticacion.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Inyectamos el servicio de autenticación
  const authService = inject(AutenticacionService);
  const authToken = authService.getToken();

  // Si no hay token, dejamos pasar la petición original (para login, register, etc.)
  if (!authToken) {
    return next(req);
  }

  // Si hay un token, clonamos la petición y añadimos la cabecera de autorización
  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${authToken}`)
  });

  // Dejamos que la nueva petición con la cabecera continúe su camino
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el error es 401 (No Autorizado), cerramos la sesión.
      if (error.status === 401 || error.status === 403) {
        authService.logout();
      }
      // Re-lanzamos el error para que otros manejadores puedan usarlo si es necesario.
      return throwError(() => error);
    })
  );
};