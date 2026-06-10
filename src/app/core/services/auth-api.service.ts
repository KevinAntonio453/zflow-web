import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthResponse, LoginRequest, RefreshRequest, RegisterRequest, Usuario } from '../models';

/**
 * Cliente HTTP fino contra /api/v1/auth/*.
 * La lógica de sesión (signals, localStorage, redirects) vive en AuthService.
 */
@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/auth';

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, req);
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, req);
  }

  refresh(req: RefreshRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, req);
  }

  me(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.baseUrl}/me`);
  }

  updateProfile(nombre: string, email: string): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/me`, { nombre, email });
  }

  changePassword(oldPassword: string, newPassword: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/me/password`, { oldPassword, newPassword });
  }
}
