import type { Prisma } from '@prisma/client';
import { prisma, type Transacao } from '../../infra/prisma';
import { ErroConflito } from '../../shared/errors';
import type { Intervalo, Modalidade, Paginacao, StatusAula } from '../../shared/types/dominio';
import { ehViolacaoDeExclusao } from '../../shared/utils/erros-banco';
import { STATUS_QUE_OCUPAM_HORARIO } from './aulas.estados';

export interface AulaResumo {
  id: string;
  inicio: Date;
  fim: Date;
  modalidade: Modalidade;
  objetivo: string | null;
  status: StatusAula;
  serieId: string | null;
  motivoCancelamento: string | null;
  criadoEm: Date;
  materia: { id: string; nome: string; nivel: string };
  aluno: { id: string; nome: string };
  professor: { id: string; usuarioId: string; nome: string };
}

export interface HistoricoDados {
  status: StatusAula;
  dataHora: Date;
  motivo: string | null;
  autorId: string | null;
}

export interface RemarcacaoDados {
  id: string;
  propostoPorId: string;
  novoInicio: Date;
  novoFim: Date;
  aceita: boolean | null;
  criadoEm: Date;
}

export interface AulaDetalhe extends AulaResumo {
  anotacoes: string | null;
  historico: HistoricoDados[];
  remarcacoes: RemarcacaoDados[];
}

export interface NovaAula {
  alunoId: string;
  professorId: string;
  materiaId: string;
  inicio: Date;
  fim: Date;
  modalidade: Modalidade;
  objetivo: string | null;
  serieId: string | null;
}

export interface FiltroListagemAulas {
  alunoId?: string;
  professorId?: string;
  status?: StatusAula;
  de?: Date;
  ate?: Date;
}

export interface DadosTransicao {
  aulaId: string;
  de: StatusAula;
  para: StatusAula;
  autorId: string;
  motivo?: string | null;
}

export interface ResultadoListagemAulas {
  itens: AulaResumo[];
  total: number;
}

export interface AulasRepositorio {
  criarAulas(tx: Transacao, aulas: NovaAula[], autorId: string): Promise<AulaResumo[]>;
  buscarPorId(id: string): Promise<AulaDetalhe | null>;
  listar(filtro: FiltroListagemAulas, paginacao: Paginacao): Promise<ResultadoListagemAulas>;
  listarIntervalosOcupados(professorId: string, de: Date, ate: Date): Promise<Intervalo[]>;
  existeConflito(
    tx: Transacao,
    professorId: string,
    intervalo: Intervalo,
    ignorarAulaId: string,
  ): Promise<boolean>;
  transicionar(tx: Transacao, dados: DadosTransicao): Promise<void>;
  /**
   * Reserva a agenda do professor até o fim da transação: outra transação que tente reservá-la
   * espera esta terminar. Assim, aceites simultâneos do mesmo professor entram em fila.
   */
  bloquearAgendaDoProfessor(tx: Transacao, professorId: string): Promise<void>;
  /** Pedidos ainda pendentes (SOLICITADA) do professor que se sobrepõem ao intervalo. */
  listarPedidosSobrepostos(
    tx: Transacao,
    professorId: string,
    intervalo: Intervalo,
    ignorarAulaIds: string[],
  ): Promise<AulaResumo[]>;
  /** Pedidos pendentes de uma série semanal que ainda vão acontecer, na ordem do calendário. */
  listarPedidosDaSerie(serieId: string, aPartirDe: Date): Promise<AulaResumo[]>;
}

const inclusaoResumo = {
  materia: { select: { id: true, nome: true, nivel: true } },
  aluno: { select: { id: true, nome: true } },
  professor: { select: { id: true, usuarioId: true, usuario: { select: { nome: true } } } },
} satisfies Prisma.AulaInclude;

const inclusaoDetalhe = {
  ...inclusaoResumo,
  historico: {
    select: { status: true, dataHora: true, motivo: true, autorId: true },
    orderBy: [{ dataHora: 'asc' }, { id: 'asc' }],
  },
  remarcacoes: {
    select: {
      id: true,
      propostoPorId: true,
      novoInicio: true,
      novoFim: true,
      aceita: true,
      criadoEm: true,
    },
    orderBy: { criadoEm: 'asc' },
  },
} satisfies Prisma.AulaInclude;

type RegistroResumo = Prisma.AulaGetPayload<{ include: typeof inclusaoResumo }>;
type RegistroDetalhe = Prisma.AulaGetPayload<{ include: typeof inclusaoDetalhe }>;

function paraResumo(registro: RegistroResumo): AulaResumo {
  return {
    id: registro.id,
    inicio: registro.inicio,
    fim: registro.fim,
    modalidade: registro.modalidade,
    objetivo: registro.objetivo,
    status: registro.status,
    serieId: registro.serieId,
    motivoCancelamento: registro.motivoCancelamento,
    criadoEm: registro.criadoEm,
    materia: registro.materia,
    aluno: registro.aluno,
    professor: {
      id: registro.professor.id,
      usuarioId: registro.professor.usuarioId,
      nome: registro.professor.usuario.nome,
    },
  };
}

function paraDetalhe(registro: RegistroDetalhe): AulaDetalhe {
  return {
    ...paraResumo(registro),
    anotacoes: registro.anotacoes,
    historico: registro.historico,
    remarcacoes: registro.remarcacoes,
  };
}

function montarFiltro(filtro: FiltroListagemAulas): Prisma.AulaWhereInput {
  const periodo: Prisma.DateTimeFilter = {};
  if (filtro.de) periodo.gte = filtro.de;
  if (filtro.ate) periodo.lte = filtro.ate;
  return {
    ...(filtro.alunoId ? { alunoId: filtro.alunoId } : {}),
    ...(filtro.professorId ? { professorId: filtro.professorId } : {}),
    ...(filtro.status ? { status: filtro.status } : {}),
    ...(filtro.de || filtro.ate ? { inicio: periodo } : {}),
  };
}

export class AulasRepositorioPrisma implements AulasRepositorio {
  async criarAulas(tx: Transacao, aulas: NovaAula[], autorId: string): Promise<AulaResumo[]> {
    const criadas: AulaResumo[] = [];
    for (const aula of aulas) {
      const registro = await tx.aula.create({
        data: {
          ...aula,
          status: 'SOLICITADA',
          historico: { create: { status: 'SOLICITADA', autorId } },
        },
        include: inclusaoResumo,
      });
      criadas.push(paraResumo(registro));
    }
    return criadas;
  }

  async buscarPorId(id: string): Promise<AulaDetalhe | null> {
    const registro = await prisma.aula.findUnique({ where: { id }, include: inclusaoDetalhe });
    return registro ? paraDetalhe(registro) : null;
  }

  async listar(filtro: FiltroListagemAulas, paginacao: Paginacao): Promise<ResultadoListagemAulas> {
    const where = montarFiltro(filtro);
    const [registros, total] = await Promise.all([
      prisma.aula.findMany({
        where,
        include: inclusaoResumo,
        orderBy: [{ inicio: 'desc' }, { id: 'asc' }],
        skip: paginacao.pular,
        take: paginacao.limite,
      }),
      prisma.aula.count({ where }),
    ]);
    return { itens: registros.map(paraResumo), total };
  }

  listarIntervalosOcupados(professorId: string, de: Date, ate: Date): Promise<Intervalo[]> {
    return prisma.aula.findMany({
      where: {
        professorId,
        status: { in: STATUS_QUE_OCUPAM_HORARIO },
        inicio: { lt: ate },
        fim: { gt: de },
      },
      select: { inicio: true, fim: true },
    });
  }

  async existeConflito(
    tx: Transacao,
    professorId: string,
    intervalo: Intervalo,
    ignorarAulaId: string,
  ): Promise<boolean> {
    const total = await tx.aula.count({
      where: {
        professorId,
        id: { not: ignorarAulaId },
        status: { in: STATUS_QUE_OCUPAM_HORARIO },
        inicio: { lt: intervalo.fim },
        fim: { gt: intervalo.inicio },
      },
    });
    return total > 0;
  }

  async listarPedidosSobrepostos(
    tx: Transacao,
    professorId: string,
    intervalo: Intervalo,
    ignorarAulaIds: string[],
  ): Promise<AulaResumo[]> {
    const registros = await tx.aula.findMany({
      where: {
        professorId,
        id: { notIn: ignorarAulaIds },
        status: 'SOLICITADA',
        inicio: { lt: intervalo.fim },
        fim: { gt: intervalo.inicio },
      },
      include: inclusaoResumo,
      orderBy: [{ criadoEm: 'asc' }, { id: 'asc' }],
    });
    return registros.map(paraResumo);
  }

  async listarPedidosDaSerie(serieId: string, aPartirDe: Date): Promise<AulaResumo[]> {
    const registros = await prisma.aula.findMany({
      where: { serieId, status: 'SOLICITADA', inicio: { gt: aPartirDe } },
      include: inclusaoResumo,
      orderBy: [{ inicio: 'asc' }, { id: 'asc' }],
    });
    return registros.map(paraResumo);
  }

  async bloquearAgendaDoProfessor(tx: Transacao, professorId: string): Promise<void> {
    await tx.$queryRaw`SELECT 1 FROM "PerfilProfessor" WHERE id = ${professorId} FOR UPDATE`;
  }

  async transicionar(tx: Transacao, dados: DadosTransicao): Promise<void> {
    try {
      const atualizadas = await tx.aula.updateMany({
        where: { id: dados.aulaId, status: dados.de },
        data: { status: dados.para },
      });
      if (atualizadas.count === 0) {
        throw new ErroConflito(
          'O status da aula mudou durante a operação. Atualize e tente novamente',
          'STATUS_DESATUALIZADO',
        );
      }
    } catch (erro) {
      if (ehViolacaoDeExclusao(erro)) {
        throw new ErroConflito(
          'Já existe uma aula confirmada neste horário',
          'CONFLITO_DE_HORARIO',
        );
      }
      throw erro;
    }
    await tx.historicoStatus.create({
      data: {
        aulaId: dados.aulaId,
        status: dados.para,
        motivo: dados.motivo ?? null,
        autorId: dados.autorId,
      },
    });
  }
}
