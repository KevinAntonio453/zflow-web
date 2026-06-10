import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthApiService } from '../services/auth-api.service';
import {
  AuthResponse,
  JwtPayload,
  LoginRequest,
  RegisterRequest,
  Rol,
  Usuario,
} from '../models';

const ACCESS_TOKEN_KEY  = 'zflow-access-token';
const REFRESH_TOKEN_KEY = 'zflow-refresh-token';
const USER_KEY          = 'zflow-user';

/**
 * Estado de sesión y operaciones de autenticación.
 *
 * Decisión arquitectónica (planificacion_frontend.md §6):
 *   - Estado: signals (sin NgRx)
 *   - Persistencia: localStorage (sincronizado con las signals en cada cambio)
 *   - Refresh: el interceptor llama al backend si recibe 401; este service
 *     expone refresh() para uso manual si fuera necesario
 *   - Decodificación JWT: solo en cliente (rol no cambia dentro de la sesión)
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api    = inject(AuthApiService);
  private readonly router = inject(Router);

  private readonly _user        = signal<Usuario | null>(this.loadUser());
  private readonly _accessToken = signal<string | null>(this.loadToken(ACCESS_TOKEN_KEY));
  private readonly _refreshToken = signal<string | null>(this.loadToken(REFRESH_TOKEN_KEY));

  readonly user          = this._user.asReadonly();
  readonly accessToken   = this._accessToken.asReadonly();
  readonly refreshToken  = this._refreshToken.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null && this._accessToken() !== null);
  readonly rol             = computed<Rol | null>(() => this._user()?.rol ?? null);

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.api.login(req).pipe(tap(res => this.persist(res)));
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.api.register(req).pipe(tap(res => this.persist(res)));
  }

  logout(redirect = true): void {
    this._user.set(null);
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this.clearStorage();
    if (redirect) {
      this.router.navigate(['/auth/login']);
    }
  }

  hasRol(...roles: Rol[]): boolean {
    const r = this._user()?.rol;
    return r !== undefined && roles.includes(r);
  }

  /**
   * Decodifica el payload de un JWT HS256 (sin verificar firma — la verificación
   * la hace el backend). Retorna null si el token es inválido o está expirado.
   */
  decodeToken(token: string | null = this._accessToken()): JwtPayload | null {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = atob(payload);
      const claims = JSON.parse(json) as JwtPayload;
      if (typeof claims.exp === 'number' && claims.exp * 1000 < Date.now()) {
        return null;
      }
      return claims;
    } catch {
      return null;
    }
  }

  updateCurrentUser(user: Usuario): void {
    this._user.set(user);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
  }

  private persist(res: AuthResponse): void {
    this._user.set(res.user);
    this._accessToken.set(res.accessToken);
    this._refreshToken.set(res.refreshToken);
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    } catch {
      // ignore quota / private mode
    }
  }

  private clearStorage(): void {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // ignore
    }
  }

  private loadUser(): Usuario | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as Usuario; } catch { return null; }
  }

  private loadToken(key: string): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  }
}
