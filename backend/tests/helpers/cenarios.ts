import type { Express } from 'express';
import request from 'supertest';
import { prisma } from '../../src/infra/prisma';
import {
  componentesBrasilia,
  criarDataBrasilia,
  formatarIsoBrasilia,
  somarMinutos,
} from '../../src/shared/utils/datas';
import { autorizado, type UsuarioDeTeste } from './app';

const MS_POR_DIA = 24 * 60 * 60 * 1000;

export async function criarMateria(
  nome = 'Matemática',
  nivel = 'Ensino Médio',
): Promise<{ id: string }> {
  return prisma.materia.create({ data: { nome, nivel }, select: { id: true } });
}

export async function prepararProfessor(
  app: Express,
  usuario: UsuarioDeTeste,
  materiaIds: string[],
  modalidades: string[] = ['ONLINE', 'PRESENCIAL'],
): Promise<{ professorId: string }> {
  const perfil = await request(app)
    .put('/api/v1/professores/me')
    .set(autorizado(usuario.token))
    .send({
      apresentacao: 'Aulas particulares com foco em resultados',
      valorHora: 80,
      modalidades,
      materiaIds,
    });
  if (perfil.status !== 200) throw new Error(`Perfil falhou: ${JSON.stringify(perfil.body)}`);

  const grade = await request(app)
    .put('/api/v1/professores/me/disponibilidade')
    .set(autorizado(usuario.token))
    .send({
      faixas: [0, 1, 2, 3, 4, 5, 6].flatMap((diaSemana) => [
        { diaSemana, horaInicio: '08:00', horaFim: '12:00' },
        { diaSemana, horaInicio: '14:00', horaFim: '18:00' },
      ]),
    });
  if (grade.status !== 200) throw new Error(`Grade falhou: ${JSON.stringify(grade.body)}`);

  const registro = await prisma.perfilProfessor.findUniqueOrThrow({
    where: { usuarioId: usuario.id },
    select: { id: true },
  });
  return { professorId: registro.id };
}

export function horario(
  diasAFrente: number,
  hora: number,
  duracaoMinutos = 60,
): { inicio: string; fim: string } {
  const alvo = componentesBrasilia(new Date(Date.now() + diasAFrente * MS_POR_DIA));
  const inicio = criarDataBrasilia(alvo.ano, alvo.mes, alvo.dia, hora);
  return {
    inicio: formatarIsoBrasilia(inicio),
    fim: formatarIsoBrasilia(somarMinutos(inicio, duracaoMinutos)),
  };
}
