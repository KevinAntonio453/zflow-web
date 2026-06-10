import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Notificacion } from '../models';

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

@Injectable({ providedIn: 'root' })
export class NotificacionesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/notificaciones';

  list(page = 0, size = 20): Observable<Page<Notificacion>> {
    return this.http.get<Page<Notificacion>>(`${this.baseUrl}?page=${page}&size=${size}`);
  }

  countNoLeidas(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/no-leidas/count`);
  }

  leer(id: string): Observable<Notificacion> {
    return this.http.patch<Notificacion>(`${this.baseUrl}/${id}/leer`, {});
  }

  leerTodas(): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/leer-todas`, {});
  }
}
