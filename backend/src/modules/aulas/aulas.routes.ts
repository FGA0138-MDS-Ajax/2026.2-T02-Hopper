import { Router } from 'express';
import { autenticar } from '../../shared/middlewares/autenticar';
import { autorizar } from '../../shared/middlewares/autorizar';
import { validar } from '../../shared/middlewares/validar';
import { esquemaParametroId } from '../../shared/utils/validacoes';
import type { AulasController } from './aulas.controller';
import { esquemaCriarAula, esquemaListarAulas, esquemaRecusarAula } from './aulas.schemas';

const apenasAluno = [autenticar, autorizar('ALUNO')];
const apenasProfessor = [autenticar, autorizar('PROFESSOR')];
const alunoOuProfessor = [autenticar, autorizar('ALUNO', 'PROFESSOR')];

export function criarRotasAulas(controlador: AulasController): Router {
  const rotas = Router();
  rotas.post('/', ...apenasAluno, validar({ body: esquemaCriarAula }), controlador.solicitar);
  rotas.get('/', ...alunoOuProfessor, validar({ query: esquemaListarAulas }), controlador.listar);
  rotas.get(
    '/:id',
    ...alunoOuProfessor,
    validar({ params: esquemaParametroId }),
    controlador.obterDetalhe,
  );
  rotas.patch(
    '/:id/aceitar',
    ...apenasProfessor,
    validar({ params: esquemaParametroId }),
    controlador.aceitar,
  );
  rotas.patch(
    '/:id/recusar',
    ...apenasProfessor,
    validar({ params: esquemaParametroId, body: esquemaRecusarAula }),
    controlador.recusar,
  );
  return rotas;
}
