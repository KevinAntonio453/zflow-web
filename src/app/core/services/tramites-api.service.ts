import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompletarPasoRequest, CreateTramiteRequest, Tramite, SugerenciaPoliticaResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class TramitesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/tramites';

  create(payload: CreateTramiteRequest): Observable<Tramite> {
    return this.http.post<Tramite>(this.baseUrl, payload);
  }

  list(): Observable<Tramite[]> {
    return this.http.get<Tramite[]>(this.baseUrl);
  }

  findById(id: string): Observable<Tramite> {
    return this.http.get<Tramite>(`${this.baseUrl}/${id}`);
  }

  completarPaso(id: string, payload: CompletarPasoRequest): Observable<Tramite> {
    return this.http.post<Tramite>(`${this.baseUrl}/${id}/completar`, payload);
  }

  cancelar(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/cancelar`, {});
  }

  sugerirPolitica(audio: Blob): Observable<SugerenciaPoliticaResponse> {
    const formData = new FormData();
    formData.append('file', audio, 'grabacion.wav');
    return this.http.post<SugerenciaPoliticaResponse>(`${this.baseUrl}/sugerir-politica`, formData);
  }

  transcribir(audio: Blob): Observable<{ text: string }> {
    const formData = new FormData();
    formData.append('file', audio, 'grabacion.wav');
    return this.http.post<{ text: string }>(`${this.baseUrl}/transcribir`, formData);
  }

  getDiagnosticoIa(id: string): Observable<DiagnosticoIaResponse> {
    return this.http.get<DiagnosticoIaResponse>(`${this.baseUrl}/${id}/diagnostico-ia`);
  }

  aplicarReenrutamiento(id: string, nuevoResponsableId: string): Observable<Tramite> {
    return this.http.patch<Tramite>(`${this.baseUrl}/${id}/reenrutar?nuevoResponsableId=${nuevoResponsableId}`, {});
  }
}

export interface DiagnosticoIaResponse {
  tramiteId: string;
  politicaNombre: string;
  actividadNombre: string;
  prioridadScore: number;
  prioridadLabel: string;
  riesgoDemora: number;
  anomaliaDetectada: boolean;
  anomaliaScore: number;
  rutaOptimaSugerida: string;
  sugerenciaReenrutamiento: string | null;
  candidatoReenrutamientoId: string | null;
}

