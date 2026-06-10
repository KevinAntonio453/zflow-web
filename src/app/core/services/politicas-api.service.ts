import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ActualizarPoliticaRequest,
  CrearPoliticaRequest,
  EstadoPolitica,
  Politica,
} from '../models';

@Injectable({ providedIn: 'root' })
export class PoliticasApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/politicas';

  list(estado?: EstadoPolitica): Observable<Politica[]> {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    return this.http.get<Politica[]>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Politica> {
    return this.http.get<Politica>(`${this.baseUrl}/${id}`);
  }

  create(req: CrearPoliticaRequest): Observable<Politica> {
    return this.http.post<Politica>(this.baseUrl, req);
  }

  update(id: string, req: ActualizarPoliticaRequest): Observable<Politica> {
    return this.http.put<Politica>(`${this.baseUrl}/${id}`, req);
  }

  activate(id: string): Observable<Politica> {
    return this.http.patch<Politica>(`${this.baseUrl}/${id}/activar`, {});
  }

  deactivate(id: string): Observable<Politica> {
    return this.http.patch<Politica>(`${this.baseUrl}/${id}/desactivar`, {});
  }
}
