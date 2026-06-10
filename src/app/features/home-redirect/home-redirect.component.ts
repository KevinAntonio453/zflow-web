import { Component, effect, inject, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

/**
 * Componente "puente" para la ruta '/'.
 * Se monta dentro del shell (authGuard ya pasó) y elige el home del rol
 * usando signals — una sola navegación, sin cadena de redirects.
 */
@Component({
  selector: 'zf-home-redirect',
  template: `<p class="text-text-secondary text-sm">Redirigiendo...</p>`,
})
export class HomeRedirectComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      // Leemos el rol para suscribirnos, pero solo navegamos una vez.
      const rol = this.auth.rol();
      untracked(() => {
        const target = this.targetFor(rol);
        this.router.navigateByUrl(target, { replaceUrl: true });
      });
    });
  }

  private targetFor(rol: string | null): string {
    switch (rol) {
      case 'ADMIN':       return '/admin/dashboard';
      case 'JEFE':        return '/jefe/dashboard';
      case 'FUNCIONARIO': return '/funcionario/dashboard';
      case 'CLIENTE':     return '/cliente/dashboard';
      default:            return '/auth/login';
    }
  }
}
