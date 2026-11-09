import express, { type Express } from 'express';
import { env } from './config/env';
import './config/zod-ptbr';
import { enviarEmailRecuperacao } from './infra/email';
import { transacao } from './infra/prisma';
import { AgendaController } from './modules/agenda/agenda.controller';
import { AgendaRepositorioPrisma } from './modules/agenda/agenda.repository';
import { criarRotasAgenda } from './modules/agenda/agenda.routes';
import { AgendaService } from './modules/agenda/agenda.service';
import { AuthController } from './modules/auth/auth.controller';
import { AuthRepositorioPrisma } from './modules/auth/auth.repository';
import { criarRotasAuth } from './modules/auth/auth.routes';
import { AuthService } from './modules/auth/auth.service';
import { AulasController } from './modules/aulas/aulas.controller';
import { AulasRepositorioPrisma } from './modules/aulas/aulas.repository';
import { criarRotasAulas } from './modules/aulas/aulas.routes';
import { AulasService } from './modules/aulas/aulas.service';
import { NotificacoesController } from './modules/notificacoes/notificacoes.controller';
import { NotificacoesRepositorioPrisma } from './modules/notificacoes/notificacoes.repository';
import { criarRotasNotificacoes } from './modules/notificacoes/notificacoes.routes';
import { NotificacoesService } from './modules/notificacoes/notificacoes.service';
import { UsuariosController } from './modules/usuarios/usuarios.controller';
import { UsuariosRepositorioPrisma } from './modules/usuarios/usuarios.repository';
import { criarRotasUsuarios } from './modules/usuarios/usuarios.routes';
import { UsuariosService } from './modules/usuarios/usuarios.service';
import { middlewareCors, middlewareHelmet } from './shared/middlewares/cors';
import { rotaNaoEncontrada, tratarErros } from './shared/middlewares/tratar-erros';
import { serializarDatasNoFuso } from './shared/utils/datas';
import { criarSeguranca } from './shared/utils/seguranca';

export interface DependenciasDoApp {
  enviarEmailRecuperacao?: (destino: string, link: string) => Promise<void>;
}

const LIMITE_DO_CORPO = '100kb';

export function criarApp(dependencias: DependenciasDoApp = {}): Express {
  const seguranca = criarSeguranca({
    segredoJwt: env.JWT_SECRET,
    expiracaoJwt: env.JWT_EXPIRES_IN,
  });

  const authServico = new AuthService({
    repositorio: new AuthRepositorioPrisma(),
    seguranca,
    enviarEmailRecuperacao: dependencias.enviarEmailRecuperacao ?? enviarEmailRecuperacao,
    frontendUrl: env.FRONTEND_URL,
  });

  const agendaServico = new AgendaService({
    repositorio: new AgendaRepositorioPrisma(),
    ocupacao: {
      listarIntervalosOcupados: (professorId, de, ate) =>
        aulasServico.listarIntervalosOcupados(professorId, de, ate),
    },
  });

  const usuariosServico = new UsuariosService({
    repositorio: new UsuariosRepositorioPrisma(),
    horarios: agendaServico,
  });

  const notificacoesServico = new NotificacoesService({
    repositorio: new NotificacoesRepositorioPrisma(),
  });

  const aulasServico: AulasService = new AulasService({
    repositorio: new AulasRepositorioPrisma(),
    usuarios: usuariosServico,
    agenda: agendaServico,
    notificacoes: notificacoesServico,
    transacao,
  });

  const app = express();
  app.disable('x-powered-by');
  // Todas as datas das respostas saem em ISO 8601 no horário de Brasília (-03:00).
  app.set('json replacer', serializarDatasNoFuso);
  app.use(middlewareHelmet);
  app.use(middlewareCors);
  app.use(express.json({ limit: LIMITE_DO_CORPO }));

  const api = express.Router();
  api.get('/saude', (_req, res) => {
    res.status(200).json({ status: 'ok', horario: new Date() });
  });
  api.use(criarRotasUsuarios(new UsuariosController(usuariosServico)));
  api.use('/aulas', criarRotasAulas(new AulasController(aulasServico)));
  api.use('/notificacoes', criarRotasNotificacoes(new NotificacoesController(notificacoesServico)));
  api.use('/auth', criarRotasAuth(new AuthController(authServico)));
  api.use('/professores', criarRotasAgenda(new AgendaController(agendaServico)));

  app.use('/api/v1', api);
  app.use(rotaNaoEncontrada);
  app.use(tratarErros);
  return app;
}
