import { Router } from 'express';
import { autenticar } from '../../shared/middlewares/autenticar';
import { autorizar } from '../../shared/middlewares/autorizar';
import { validar } from '../../shared/middlewares/validar';
import { esquemaParametroId } from '../../shared/utils/validacoes';
import type { AgendaController } from './agenda.controller';
import { esquemaCriarBloqueio, esquemaSubstituirGrade } from './agenda.schemas';

const apenasProfessor = [autenticar, autorizar('PROFESSOR')];

export function criarRotasAgenda(controlador: AgendaController): Router {
  const rotas = Router();
  rotas.get('/me/disponibilidade', ...apenasProfessor, controlador.obterGrade);
  rotas.put(
    '/me/disponibilidade',
    ...apenasProfessor,
    validar({ body: esquemaSubstituirGrade }),
    controlador.substituirGrade,
  );
  rotas.get('/me/bloqueios', ...apenasProfessor, controlador.listarBloqueios);
  rotas.post(
    '/me/bloqueios',
    ...apenasProfessor,
    validar({ body: esquemaCriarBloqueio }),
    controlador.criarBloqueio,
  );
  rotas.delete(
    '/me/bloqueios/:id',
    ...apenasProfessor,
    validar({ params: esquemaParametroId }),
    controlador.removerBloqueio,
  );
  return rotas;
}
