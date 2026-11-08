import { Router } from 'express';
import { autenticar } from '../../shared/middlewares/autenticar';
import { limitadorLogin, limitadorRecuperacao } from '../../shared/middlewares/limitar-taxa';
import { validar } from '../../shared/middlewares/validar';
import type { AuthController } from './auth.controller';
import {
  esquemaCadastro,
  esquemaLogin,
  esquemaRecuperarSenha,
  esquemaRedefinirSenha,
} from './auth.schemas';

export function criarRotasAuth(controlador: AuthController): Router {
  const rotas = Router();
  rotas.post('/cadastro', validar({ body: esquemaCadastro }), controlador.cadastrar);
  rotas.post('/login', limitadorLogin, validar({ body: esquemaLogin }), controlador.login);
  rotas.get('/me', autenticar, controlador.usuarioAtual);
  rotas.post(
    '/recuperar-senha',
    limitadorRecuperacao,
    validar({ body: esquemaRecuperarSenha }),
    controlador.recuperarSenha,
  );
  rotas.post(
    '/redefinir-senha',
    validar({ body: esquemaRedefinirSenha }),
    controlador.redefinirSenha,
  );
  return rotas;
}
