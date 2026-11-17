import type { Request } from 'express';
import { ErroNaoAutenticado } from '../errors';
import type { UsuarioAutenticado } from './dominio';

declare module 'express-serve-static-core' {
  interface Request {
    usuario?: UsuarioAutenticado;
  }
}

export function exigirUsuario(req: Request): UsuarioAutenticado {
  if (!req.usuario) throw new ErroNaoAutenticado();
  return req.usuario;
}
