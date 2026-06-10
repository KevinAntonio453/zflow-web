export interface VersionDocumento {
  version: number;
  s3Key: string;
  subidoPor: string;
  fecha: string;
}

export interface AnalisisIa {
  valido: boolean;
  scoreDiscrepancia: number;
  resumen: string;
  alertas: string[];
  analizadoEn: string;
}

export interface Documento {
  id: string;
  tramiteId: string;
  nombre: string;
  tipoMime: string;
  tamanioBytes: number;
  s3Key: string;
  subidoPor: string;
  permisos: string[];
  versiones: VersionDocumento[];
  analisisIa?: AnalisisIa;
  createdAt: string;
}
