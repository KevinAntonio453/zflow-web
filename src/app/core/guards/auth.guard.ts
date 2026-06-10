import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlSegment } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/**
 * canMatch en vez de canActivate: si falla, el lazy chunk ni siquiera se descarga.
 * Si el usuario no está autenticado, redirige a /auth/login con ?redirect=<path intentado>.
 */
export const authGuard: CanMatchFn = (_route, segments: UrlSegment[]) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  const target = '/' + segments.map(s => s.path).join('/');
  router.navigate(['/auth/login'], { queryParams: { redirect: target } });
  return false;
};
