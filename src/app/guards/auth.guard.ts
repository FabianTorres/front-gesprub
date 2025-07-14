import { CanActivateFn , Router} from '@angular/router';
import { inject } from '@angular/core';
import { AutenticacionService } from '../services/autenticacion.service';

export const authGuard: CanActivateFn = (route, state) => {
  // Inyectamos nuestro servicio de autenticación y el router
  const authService = inject(AutenticacionService);
  const router = inject(Router);

  // Usamos el método que ya creamos para ver si hay un token
  if (authService.isLoggedIn()) {
    return true; // Si está logueado, permitir el acceso a la ruta
  }

  // Si no está logueado, redirigir a la página de login
  router.navigate(['/login']);
  return false; // Y denegar el acceso a la ruta protegida
};
