export type TipoNotificacion = 'TAREA_ASIGNADA' | 'TRAMITE_AVANCE' | 'TRAMITE_PAUSADO' | 'DOCUMENTO_REQUERIDO';

export interface Notificacion {
  id: string;
  usuarioId: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  tramiteId: string;
  leida: boolean;
  createdAt: string;
}
