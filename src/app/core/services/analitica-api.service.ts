import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tramite } from '../models';

export interface PolicyMetric {
  politicaNombre: string;
  cantidad: number;
}

export interface DateMetric {
  fecha: string;
  valor: number;
}

export interface AdminMetricasResponse {
  tramitesActivos: number;
  politicasActivas: number;
  funcionarios: number;
  tramitesCompletadosHoy: number;
  ultimosTramites: Tramite[];
}

export interface AdminGraficasResponse {
  tramitesPorPolitica: PolicyMetric[];
  tiemposAtencionPromedio: DateMetric[];
}

export interface FuncionarioMetric {
  nombre: string;
  tareasPendientes: number;
}

export interface JefeMetricasResponse {
  tareasPendientes: number;
  tareasEnRiesgo: number;
  tareasCompletadasHoy: number;
  cargaTrabajoFuncionario: FuncionarioMetric[];
  tramitesPausados: Tramite[];
}

export interface CuelloBotellaResponse {
  politicaNombre: string;
  totalTramitesAnalizados: number;
  sugerencias: string[];
}

export interface FuncionarioMetricasResponse {
  tareasPendientes: number;
  tareasCompletadasHoy: number;
  tareasCompletadasSemana: number;
  tiempoResolucionPromedio: number;
  cargaTrabajoDepartamento: number;
  tareasPrioritarias: Tramite[];
}

@Injectable({ providedIn: 'root' })
export class AnaliticaApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/analitica';

  getAdminMetricas(): Observable<AdminMetricasResponse> {
    return this.http.get<AdminMetricasResponse>(`${this.baseUrl}/admin-dashboard/metricas`);
  }

  getAdminGraficas(): Observable<AdminGraficasResponse> {
    return this.http.get<AdminGraficasResponse>(`${this.baseUrl}/admin-dashboard/graficas`);
  }

  getJefeMetricas(): Observable<JefeMetricasResponse> {
    return this.http.get<JefeMetricasResponse>(`${this.baseUrl}/jefe-dashboard/metricas`);
  }

  getCuellosBotella(politicaId: string): Observable<CuelloBotellaResponse> {
    return this.http.get<CuelloBotellaResponse>(`${this.baseUrl}/cuellos-botella/${politicaId}`);
  }

  getFuncionarioMetricas(): Observable<FuncionarioMetricasResponse> {
    return this.http.get<FuncionarioMetricasResponse>(`${this.baseUrl}/funcionario-dashboard/metricas`);
  }

  generarReportePdf(prompt?: string, audio?: Blob): Observable<Blob> {
    const formData = new FormData();
    if (prompt) {
      formData.append('prompt', prompt);
    }
    if (audio) {
      formData.append('file', audio, 'grabacion.wav');
    }
    return this.http.post(`${this.baseUrl}/reporte/generar`, formData, {
      responseType: 'blob'
    });
  }

  queryReporteDatos(prompt?: string, audio?: Blob): Observable<any> {
    const formData = new FormData();
    if (prompt) {
      formData.append('prompt', prompt);
    }
    if (audio) {
      formData.append('file', audio, 'grabacion.wav');
    }
    return this.http.post<any>(`${this.baseUrl}/reporte/datos`, formData);
  }
}
