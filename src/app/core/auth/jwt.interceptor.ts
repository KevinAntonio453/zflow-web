import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

/** Endpoints que NO deben llevar Authorization header. */
const PUBLIC_PATH_SUFFIXES = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
];

/**
 * Interceptor funcional (Angular 15+).
 * - Inyecta Bearer token en cada request a /api/v1/* (excepto auth público)
 * - En 401 limpia sesión y redirige a /auth/login?expired=1
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  // Anteponer la URL de producción si corresponde
  if (req.url.startsWith('/api/')) {
    req = req.clone({ url: environment.apiUrl + req.url });
  }

  const isPublic = PUBLIC_PATH_SUFFIXES.some(suffix => req.url.endsWith(suffix));
  const token    = auth.accessToken();

  const authedReq = (!isPublic && token)
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isPublic) {
        auth.logout(false);
        router.navigate(['/auth/login'], { queryParams: { expired: 1 } });
      }
      return throwError(() => err);
    })
  );
};
