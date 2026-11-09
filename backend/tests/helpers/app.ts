import type { Express } from 'express';
import request from 'supertest';
import { criarApp } from '../../src/app';
import { prisma } from '../../src/infra/prisma';

export interface EmailEnviado {
  destino: string;
  link: string;
}

export interface AppDeTeste {
  app: Express;
  emails: EmailEnviado[];
}

export function criarAppDeTeste(): AppDeTeste {
  const emails: EmailEnviado[] = [];
  const app = criarApp({
    enviarEmailRecuperacao: async (destino, link) => {
      emails.push({ destino, link });
    },
  });
  return { app, emails };
}

export async function limparBanco(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "Notificacao", "HistoricoStatus", "Remarcacao", "Avaliacao", "Aula", "BloqueioHorario", "Disponibilidade", "_ProfessorMaterias", "PerfilProfessor", "TokenRecuperacaoSenha", "Usuario", "Materia" CASCADE',
  );
}

export async function encerrarConexoes(): Promise<void> {
  await prisma.$disconnect();
}

export interface UsuarioDeTeste {
  id: string;
  token: string;
  email: string;
}

export async function cadastrarELogar(
  app: Express,
  dados: { nome: string; email: string; perfil: 'ALUNO' | 'PROFESSOR'; senha?: string },
): Promise<UsuarioDeTeste> {
  const senha = dados.senha ?? 'Senha@12345';
  const cadastro = await request(app)
    .post('/api/v1/auth/cadastro')
    .send({ ...dados, senha, consentimentoLgpd: true });
  if (cadastro.status !== 201) {
    throw new Error(`Cadastro falhou (${cadastro.status}): ${JSON.stringify(cadastro.body)}`);
  }
  const login = await request(app).post('/api/v1/auth/login').send({ email: dados.email, senha });
  if (login.status !== 200) {
    throw new Error(`Login falhou (${login.status}): ${JSON.stringify(login.body)}`);
  }
  return { id: login.body.usuario.id, token: login.body.token, email: dados.email };
}

export function autorizado(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
