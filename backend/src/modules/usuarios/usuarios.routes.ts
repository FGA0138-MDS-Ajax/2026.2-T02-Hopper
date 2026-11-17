import { Router } from 'express';
import { autenticar } from '../../shared/middlewares/autenticar';
import { autorizar } from '../../shared/middlewares/autorizar';
import { validar } from '../../shared/middlewares/validar';
import { esquemaParametroId } from '../../shared/utils/validacoes';
import type { UsuariosController } from './usuarios.controller';
import { esquemaAtualizarPerfilProfessor, esquemaAtualizarUsuario } from './usuarios.schemas';

const apenasProfessor = [autenticar, autorizar('PROFESSOR')];

export function criarRotasUsuarios(controlador: UsuariosController): Router {
  const rotas = Router();
  rotas.get('/professores', controlador.buscarProfessores);
  rotas.get('/professores/me', ...apenasProfessor, controlador.obterPerfilProprio);
  rotas.put(
    '/professores/me',
    ...apenasProfessor,
    validar({ body: esquemaAtualizarPerfilProfessor }),
    controlador.atualizarPerfilProprio,
  );
  rotas.get(
    '/professores/:id',
    validar({ params: esquemaParametroId }),
    controlador.obterProfessor,
  );
  rotas.get('/materias', controlador.listarMaterias);
  rotas.put(
    '/usuarios/me',
    autenticar,
    validar({ body: esquemaAtualizarUsuario }),
    controlador.atualizarUsuario,
  );
  return rotas;
}
