import { EstadoPolitica, ResponsableTipo, TipoFlujo } from './politica.enums';

export type TipoCampo = 'TEXTO' | 'NUMERO' | 'FECHA' | 'SELECTOR' | 'ARCHIVO';

export interface CampoFormulario {
  id: string;
  nombre: string;
  tipo: TipoCampo;
  requerido: boolean;
  opciones?: string[];
}

export interface Actividad {
  actividadId: string;
  nombre: string;
  responsableTipo: ResponsableTipo | null;
  responsableId: string | null;
  tipoFlujo: TipoFlujo;
  laneName?: string;
  formulario: CampoFormulario[];
  condicionSalida: string | null;
}

export interface Politica {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: EstadoPolitica;
  diagramaBpmn: string | null;
  creadoPor: string;
  actividades: Actividad[];
  createdAt: string;
  updatedAt: string;
}

export interface CrearPoliticaRequest {
  nombre: string;
  descripcion?: string;
  diagramaBpmn?: string;
  actividades?: Actividad[];
}

export interface ActualizarPoliticaRequest {
  nombre?: string;
  descripcion?: string;
  diagramaBpmn?: string;
  actividades?: Actividad[];
}
