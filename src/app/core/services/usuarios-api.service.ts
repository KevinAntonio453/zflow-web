import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateUsuarioRequest,
  UpdateUsuarioRequest,
  Usuario,
} from '../models';

@Injectable({ providedIn: 'root' })
export class UsuariosApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/usuarios';

  list(rol?: string): Observable<Usuario[]> {
    let params = new HttpParams();
    if (rol) params = params.set('rol', rol);
    return this.http.get<Usuario[]>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.baseUrl}/${id}`);
  }

  create(req: CreateUsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.baseUrl, req);
  }

  update(id: string, req: UpdateUsuarioRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/${id}`, req);
  }

  changeEstado(id: string, activo: boolean): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.baseUrl}/${id}/estado`, { activo });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
