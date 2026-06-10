export type EstadoTramite = 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO';
export type EstadoPaso = 'PAUSADO' | 'COMPLETADO';

export interface HistorialPaso {
  actividadId: string;
  estado: EstadoPaso;
  inicio: string;
  fin?: string;
  funcionarioId?: string;
  datosFormulario?: Record<string, any>;
  laneName?: string;
  departamentoId?: string;
}

export interface Tramite {
  id: string;
  politicaId: string;
  politicaNombre: string;
  clienteId: string;
  clienteNombre?: string;
  clienteEmail?: string;
  estado: EstadoTramite;
  pasoActual: string | null;
  pasoActualNombre: string;
  pasoActualLaneName?: string;
  s3Bucket: string;
  historial: HistorialPaso[];
  createdAt: string;
  updatedAt: string;
  prioridad?: 'alta' | 'media' | 'baja';
  prioridadScore?: number;
}

export interface CreateTramiteRequest {
  id?: string;
  politicaId: string;
  datosFormulario?: Record<string, any>;
}

export interface CompletarPasoRequest {
  actividadId: string;
  datosFormulario: Record<string, any>;
}

export interface SugerenciaPoliticaResponse {
  transcripcion: string;
  sugerenciaConfianza: boolean;
  politicaSugeridaId: string | null;
  politicasCandidatasIds: string[];
}
