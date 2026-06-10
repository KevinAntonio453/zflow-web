import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Documento, VersionDocumento } from '../models';

@Injectable({ providedIn: 'root' })
export class DocumentosApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/documentos';

  upload(file: File, tramiteId: string): Observable<Documento> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tramiteId', tramiteId);
    return this.http.post<Documento>(`${this.baseUrl}/upload`, formData);
  }

  listByTramite(tramiteId: string): Observable<Documento[]> {
    return this.http.get<Documento[]>(`${this.baseUrl}/tramite/${tramiteId}`);
  }

  descargar(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/descargar`, { responseType: 'blob' });
  }

  listVersiones(id: string): Observable<VersionDocumento[]> {
    return this.http.get<VersionDocumento[]>(`${this.baseUrl}/${id}/versiones`);
  }

  subirNuevaVersion(id: string, file: File): Observable<Documento> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Documento>(`${this.baseUrl}/${id}/nueva-version`, formData);
  }

  restaurar(id: string, version: number): Observable<Documento> {
    return this.http.put<Documento>(`${this.baseUrl}/${id}/restaurar/${version}`, {});
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  analizar(id: string): Observable<Documento> {
    return this.http.post<Documento>(`${this.baseUrl}/${id}/analizar`, {});
  }
}
