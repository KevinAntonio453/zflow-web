import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Rol } from '../models';

const ROL_HOME: Record<Rol, string> = {
  ADMIN:       '/admin/dashboard',
  JEFE:        '/jefe/dashboard',
  FUNCIONARIO: '/funcionario/dashboard',
  CLIENTE:     '/cliente/dashboard',
};

/**
 * Factory: rolGuard('ADMIN', 'JEFE')
 * Si no está autenticado → /auth/login.
 * Si está autenticado pero no tiene el rol → redirige al home de su rol.
 */
export function rolGuard(...allowed: Rol[]): CanMatchFn {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      router.navigate(['/auth/login']);
      return false;
    }

    if (auth.hasRol(...allowed)) {
      return true;
    }

    const rol = auth.rol();
    router.navigate([rol && rol in ROL_HOME ? ROL_HOME[rol] : '/auth/login']);
    return false;
  };
}
