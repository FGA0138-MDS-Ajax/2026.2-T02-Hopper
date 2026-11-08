import { Router } from 'express';
import { autenticar } from '../../shared/middlewares/autenticar';
import { autorizar } from '../../shared/middlewares/autorizar';
import { validar } from '../../shared/middlewares/validar';
import type { NotificacoesController } from './notificacoes.controller';
import { esquemaListarNotificacoes, esquemaMarcarComoLidas } from './notificacoes.schemas';

const alunoOuProfessor = [autenticar, autorizar('ALUNO', 'PROFESSOR')];

export function criarRotasNotificacoes(controlador: NotificacoesController): Router {
  const rotas = Router();
  rotas.get(
    '/',
    ...alunoOuProfessor,
    validar({ query: esquemaListarNotificacoes }),
    controlador.listar,
  );
  rotas.patch(
    '/',
    ...alunoOuProfessor,
    validar({ body: esquemaMarcarComoLidas }),
    controlador.marcarComoLidas,
  );
  return rotas;
}
