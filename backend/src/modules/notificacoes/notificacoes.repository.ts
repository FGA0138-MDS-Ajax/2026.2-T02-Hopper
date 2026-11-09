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

export interface NotificacoesRepositorio {
  criar(tx: Transacao, dados: NovaNotificacao): Promise<void>;
  listar(
    usuarioId: string,
    filtro: FiltroNotificacoes,
    paginacao: Paginacao,
  ): Promise<ResultadoListagemNotificacoes>;
  contarNaoLidas(usuarioId: string): Promise<number>;
  marcarComoLidas(usuarioId: string, ids: string[] | null): Promise<number>;
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
}
