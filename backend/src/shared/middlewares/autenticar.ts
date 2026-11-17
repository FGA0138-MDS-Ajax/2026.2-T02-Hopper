import type { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env';
import { ErroNaoAutenticado } from '../errors';
import '../types/requisicao';
import { verificarToken } from '../utils/seguranca';

const PREFIXO_BEARER = 'Bearer ';

export function autenticar(req: Request, _res: Response, next: NextFunction): void {
  const cabecalho = req.headers.authorization;
  if (!cabecalho || !cabecalho.startsWith(PREFIXO_BEARER)) {
    throw new ErroNaoAutenticado('Token de autenticação não informado');
  }
  const token = cabecalho.slice(PREFIXO_BEARER.length).trim();
  req.usuario = verificarToken(token, env.JWT_SECRET);
  next();
}
