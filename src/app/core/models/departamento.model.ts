export interface Departamento {
  id: string;
  nombre: string;
  descripcion: string | null;
  jefeId: string | null;
  activo: boolean;
  cantidadUsuarios?: number;
  createdAt?: string;
}

export interface CreateDepartamentoRequest {
  nombre: string;
  descripcion?: string | null;
  jefeId?: string | null;
}

export interface UpdateDepartamentoRequest {
  nombre?: string;
  descripcion?: string | null;
  jefeId?: string | null;
  activo?: boolean;
}
