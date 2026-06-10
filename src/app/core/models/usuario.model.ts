export type Rol = 'ADMIN' | 'JEFE' | 'FUNCIONARIO' | 'CLIENTE';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  departamentoId: string | null;
  activo: boolean;
}

export interface CreateUsuarioRequest {
  nombre: string;
  email: string;
  password?: string;
  rol: Rol;
  departamentoId?: string | null;
}

export interface UpdateUsuarioRequest {
  nombre?: string;
  email?: string;
  rol?: Rol;
  departamentoId?: string | null;
  activo?: boolean;
}
