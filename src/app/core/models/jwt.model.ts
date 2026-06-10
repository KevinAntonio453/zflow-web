import { Rol } from './usuario.model';

/**
 * Payload estándar de un JWT HS256 firmado por el backend.
 * Sub = user id (string en MongoDB).
 */
export interface JwtPayload {
  sub: string;
  email: string;
  rol: Rol;
  iss: string;
  iat: number;
  exp: number;
}
