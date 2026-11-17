import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ErroNaoAutenticado, ErroProibido } from '../errors';
import type { Perfil } from '../types/dominio';
import '../types/requisicao';

export function autorizar(...perfisPermitidos: Perfil[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.usuario) throw new ErroNaoAutenticado();
    if (!perfisPermitidos.includes(req.usuario.perfil)) {
      throw new ErroProibido('Seu perfil não tem permissão para esta operação');
    }
    next();
  };
}
