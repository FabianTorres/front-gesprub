import { CanActivateFn , Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AutenticacionService } from '../services/autenticacion.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  // Inyectamos nuestro servicio de autenticación y el router
  const authService = inject(AutenticacionService);
  const router = inject(Router);

  // Usamos el método que ya creamos para ver si hay un token
  if (authService.isLoggedIn()) {

    // 1. Obtenemos el usuario actual para poder ver su rol.
    const usuarioActual = authService.usuarioActual();

    // 2. Revisamos si la ruta a la que se intenta acceder necesita un rol específico.
    const rolRequerido = route.data['rol'];

    // 3. Si la ruta SÍ requiere un rol...
        if (rolRequerido) {
            // ...y el usuario TIENE el rol requerido...
            if (usuarioActual && usuarioActual.rolUsuario === rolRequerido) {
                return true; // ...le permitimos el paso.
            } else {
                // ...si NO tiene el rol, lo redirigimos a una página segura y denegamos el acceso.
                router.navigate(['/pages/gestion/componentes']); // Redirigir a una página principal
                return false;
            }
        }



    return true; // Si está logueado, permitir el acceso a la ruta
  }

  // Si no está logueado, redirigir a la página de login
  router.navigate(['/login']);
  return false; // Y denegar el acceso a la ruta protegida
};
