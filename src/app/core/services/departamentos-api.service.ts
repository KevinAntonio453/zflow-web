import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateDepartamentoRequest,
  Departamento,
  UpdateDepartamentoRequest,
} from '../models';

@Injectable({ providedIn: 'root' })
export class DepartamentosApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/departamentos';

  list(): Observable<Departamento[]> {
    return this.http.get<Departamento[]>(this.baseUrl);
  }

  getById(id: string): Observable<Departamento> {
    return this.http.get<Departamento>(`${this.baseUrl}/${id}`);
  }

  create(req: CreateDepartamentoRequest): Observable<Departamento> {
    return this.http.post<Departamento>(this.baseUrl, req);
  }

  update(id: string, req: UpdateDepartamentoRequest): Observable<Departamento> {
    return this.http.put<Departamento>(`${this.baseUrl}/${id}`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
