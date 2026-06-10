export type EstadoPolitica = 'BORRADOR' | 'ACTIVA' | 'INACTIVA';

export type ResponsableTipo = 'DEPARTAMENTO' | 'USUARIO';

export type TipoFlujo = 'SECUENCIAL' | 'ALTERNATIVO' | 'PARALELO' | 'ITERATIVO';

export const ESTADO_POLITICA_LABELS: Record<EstadoPolitica, string> = {
  BORRADOR: 'Borrador',
  ACTIVA:   'Activa',
  INACTIVA: 'Inactiva',
};

export const RESPONSABLE_TIPO_LABELS: Record<ResponsableTipo, string> = {
  DEPARTAMENTO: 'Departamento',
  USUARIO:      'Usuario específico',
};

export const TIPO_FLUJO_LABELS: Record<TipoFlujo, string> = {
  SECUENCIAL:  'Secuencial',
  ALTERNATIVO: 'Alternativo',
  PARALELO:    'Paralelo',
  ITERATIVO:   'Iterativo',
};
