import { prisma, type Transacao } from '../../infra/prisma';
import type { Paginacao, TipoNotificacao } from '../../shared/types/dominio';

export interface NotificacaoDados {
  id: string;
  aulaId: string | null;
  tipo: TipoNotificacao;
  mensagem: string;
  lida: boolean;
  criadoEm: Date;
}

export interface NovaNotificacao {
  usuarioId: string;
  aulaId: string | null;
  tipo: TipoNotificacao;
  mensagem: string;
  chaveUnica: string;
}

export interface FiltroNotificacoes {
  apenasNaoLidas: boolean;
}

export interface ResultadoListagemNotificacoes {
  itens: NotificacaoDados[];
  total: number;
}

/** Aula confirmada ou remarcada de um usuário, com o necessário para montar o lembrete (RF19). */
export interface AulaParaLembrete {
  id: string;
  inicio: Date;
  materiaNome: string;
  alunoId: string;
  alunoNome: string;
  professorUsuarioId: string;
  professorNome: string;
}

export interface NotificacoesRepositorio {
  criar(tx: Transacao, dados: NovaNotificacao): Promise<void>;
  listar(
    usuarioId: string,
    filtro: FiltroNotificacoes,
    paginacao: Paginacao,
  ): Promise<ResultadoListagemNotificacoes>;
  contarNaoLidas(usuarioId: string): Promise<number>;
  marcarComoLidas(usuarioId: string, ids: string[] | null): Promise<number>;
  /** Aulas CONFIRMADA/REMARCADA do usuário (como aluno ou professor) que começam no intervalo. */
  listarAulasProximas(usuarioId: string, de: Date, ate: Date): Promise<AulaParaLembrete[]>;
  /** Cria os lembretes ignorando os que já existem (mesma chaveUnica). Devolve quantos criou. */
  criarLembretes(dados: NovaNotificacao[]): Promise<number>;
}

const selecaoNotificacao = {
  id: true,
  aulaId: true,
  tipo: true,
  mensagem: true,
  lida: true,
  criadoEm: true,
} as const;

export class NotificacoesRepositorioPrisma implements NotificacoesRepositorio {
  async criar(tx: Transacao, dados: NovaNotificacao): Promise<void> {
    await tx.notificacao.createMany({ data: [dados], skipDuplicates: true });
  }

  async listar(
    usuarioId: string,
    filtro: FiltroNotificacoes,
    paginacao: Paginacao,
  ): Promise<ResultadoListagemNotificacoes> {
    const where = { usuarioId, ...(filtro.apenasNaoLidas ? { lida: false } : {}) };
    const [itens, total] = await Promise.all([
      prisma.notificacao.findMany({
        where,
        select: selecaoNotificacao,
        orderBy: [{ criadoEm: 'desc' }, { id: 'asc' }],
        skip: paginacao.pular,
        take: paginacao.limite,
      }),
      prisma.notificacao.count({ where }),
    ]);
    return { itens, total };
  }

  contarNaoLidas(usuarioId: string): Promise<number> {
    return prisma.notificacao.count({ where: { usuarioId, lida: false } });
  }

  async marcarComoLidas(usuarioId: string, ids: string[] | null): Promise<number> {
    const resultado = await prisma.notificacao.updateMany({
      where: { usuarioId, lida: false, ...(ids ? { id: { in: ids } } : {}) },
      data: { lida: true },
    });
    return resultado.count;
  }

  async listarAulasProximas(usuarioId: string, de: Date, ate: Date): Promise<AulaParaLembrete[]> {
    const aulas = await prisma.aula.findMany({
      where: {
        status: { in: ['CONFIRMADA', 'REMARCADA'] },
        inicio: { gt: de, lte: ate },
        OR: [{ alunoId: usuarioId }, { professor: { usuarioId } }],
      },
      select: {
        id: true,
        inicio: true,
        materia: { select: { nome: true } },
        aluno: { select: { id: true, nome: true } },
        professor: { select: { usuarioId: true, usuario: { select: { nome: true } } } },
      },
      orderBy: [{ inicio: 'asc' }, { id: 'asc' }],
    });
    return aulas.map((aula) => ({
      id: aula.id,
      inicio: aula.inicio,
      materiaNome: aula.materia.nome,
      alunoId: aula.aluno.id,
      alunoNome: aula.aluno.nome,
      professorUsuarioId: aula.professor.usuarioId,
      professorNome: aula.professor.usuario.nome,
    }));
  }

  async criarLembretes(dados: NovaNotificacao[]): Promise<number> {
    if (dados.length === 0) return 0;
    const resultado = await prisma.notificacao.createMany({ data: dados, skipDuplicates: true });
    return resultado.count;
  }
}
