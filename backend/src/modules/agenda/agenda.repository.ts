import { prisma } from '../../infra/prisma';
import type { FaixaHoraria, Intervalo } from '../../shared/types/dominio';

export interface BloqueioDados {
  id: string;
  professorId: string;
  inicio: Date;
  fim: Date;
  motivo: string | null;
}

export interface NovoBloqueio {
  inicio: Date;
  fim: Date;
  motivo: string | null;
}

export interface AgendaRepositorio {
  buscarProfessorIdPorUsuario(usuarioId: string): Promise<string | null>;
  listarGrade(professorId: string): Promise<FaixaHoraria[]>;
  substituirGrade(professorId: string, faixas: FaixaHoraria[]): Promise<void>;
  listarBloqueiosFuturos(professorId: string, agora: Date): Promise<BloqueioDados[]>;
  listarIntervalosBloqueados(professorId: string, de: Date, ate: Date): Promise<Intervalo[]>;
  criarBloqueio(professorId: string, dados: NovoBloqueio): Promise<BloqueioDados>;
  buscarBloqueio(id: string): Promise<BloqueioDados | null>;
  removerBloqueio(id: string): Promise<void>;
}

const selecaoBloqueio = {
  id: true,
  professorId: true,
  inicio: true,
  fim: true,
  motivo: true,
} as const;

export class AgendaRepositorioPrisma implements AgendaRepositorio {
  async buscarProfessorIdPorUsuario(usuarioId: string): Promise<string | null> {
    const perfil = await prisma.perfilProfessor.findUnique({
      where: { usuarioId },
      select: { id: true },
    });
    return perfil?.id ?? null;
  }

  listarGrade(professorId: string): Promise<FaixaHoraria[]> {
    return prisma.disponibilidade.findMany({
      where: { professorId },
      select: { diaSemana: true, horaInicio: true, horaFim: true },
      orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
    });
  }

  async substituirGrade(professorId: string, faixas: FaixaHoraria[]): Promise<void> {
    await prisma.$transaction([
      prisma.disponibilidade.deleteMany({ where: { professorId } }),
      prisma.disponibilidade.createMany({
        data: faixas.map((faixa) => ({ professorId, ...faixa })),
      }),
    ]);
  }

  listarBloqueiosFuturos(professorId: string, agora: Date): Promise<BloqueioDados[]> {
    return prisma.bloqueioHorario.findMany({
      where: { professorId, fim: { gt: agora } },
      select: selecaoBloqueio,
      orderBy: { inicio: 'asc' },
    });
  }

  listarIntervalosBloqueados(professorId: string, de: Date, ate: Date): Promise<Intervalo[]> {
    return prisma.bloqueioHorario.findMany({
      where: { professorId, inicio: { lt: ate }, fim: { gt: de } },
      select: { inicio: true, fim: true },
    });
  }

  criarBloqueio(professorId: string, dados: NovoBloqueio): Promise<BloqueioDados> {
    return prisma.bloqueioHorario.create({
      data: { professorId, ...dados },
      select: selecaoBloqueio,
    });
  }

  buscarBloqueio(id: string): Promise<BloqueioDados | null> {
    return prisma.bloqueioHorario.findUnique({ where: { id }, select: selecaoBloqueio });
  }

  async removerBloqueio(id: string): Promise<void> {
    await prisma.bloqueioHorario.delete({ where: { id } });
  }
}
