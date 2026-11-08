import { randomUUID } from 'crypto';
import type { Transacao } from '../../infra/prisma';
import type { TipoNotificacao } from '../../shared/types/dominio';
import { calcularPaginacao } from '../../shared/utils/paginacao';
import type { NotificacaoDados, NotificacoesRepositorio } from './notificacoes.repository';
import type { EntradaListarNotificacoes, EntradaMarcarComoLidas } from './notificacoes.schemas';

export interface DependenciasNotificacoesService {
  repositorio: NotificacoesRepositorio;
  gerarId?: () => string;
}

export interface EntradaNotificar {
  usuarioId: string;
  aulaId?: string | null;
  tipo: TipoNotificacao;
  mensagem: string;
  chaveUnica?: string;
}

export interface ListagemNotificacoes {
  itens: NotificacaoDados[];
  total: number;
  pagina: number;
  naoLidas: number;
}

export interface ResultadoMarcacao {
  atualizadas: number;
}

export class NotificacoesService {
  constructor(private readonly deps: DependenciasNotificacoesService) {}

  async notificar(tx: Transacao, entrada: EntradaNotificar): Promise<void> {
    const aulaId = entrada.aulaId ?? null;
    const chaveUnica =
      entrada.chaveUnica ??
      `${entrada.tipo.toLowerCase()}:${aulaId ?? 'sem-aula'}:${entrada.usuarioId}:${this.gerarId()}`;
    await this.deps.repositorio.criar(tx, {
      usuarioId: entrada.usuarioId,
      aulaId,
      tipo: entrada.tipo,
      mensagem: entrada.mensagem,
      chaveUnica,
    });
  }

  async listar(
    usuarioId: string,
    consulta: EntradaListarNotificacoes,
  ): Promise<ListagemNotificacoes> {
    const { pagina, limite, apenasNaoLidas } = consulta;
    const [resultado, naoLidas] = await Promise.all([
      this.deps.repositorio.listar(
        usuarioId,
        { apenasNaoLidas },
        calcularPaginacao({ pagina, limite }),
      ),
      this.deps.repositorio.contarNaoLidas(usuarioId),
    ]);
    return { itens: resultado.itens, total: resultado.total, pagina, naoLidas };
  }

  async marcarComoLidas(
    usuarioId: string,
    entrada: EntradaMarcarComoLidas,
  ): Promise<ResultadoMarcacao> {
    const atualizadas = await this.deps.repositorio.marcarComoLidas(usuarioId, entrada.ids ?? null);
    return { atualizadas };
  }

  private gerarId(): string {
    return this.deps.gerarId ? this.deps.gerarId() : randomUUID();
  }
}
