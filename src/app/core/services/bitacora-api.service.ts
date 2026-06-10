import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface BitacoraRegistro {
  id: string;
  usuarioNombre: string;
  usuarioEmail: string;
  accion: string;
  entidadTipo: string;
  entidadNombre: string;
  detalle?: Record<string, any>;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class BitacoraApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/bitacora';

  getBitacora(page: number = 0, size: number = 20): Observable<Page<BitacoraRegistro>> {
    return this.http.get<Page<BitacoraRegistro>>(`${this.baseUrl}?page=${page}&size=${size}`);
  }
}
