import { randomUUID } from 'crypto';
import type { Transacao } from '../../infra/prisma';
import type { TipoNotificacao } from '../../shared/types/dominio';
import { formatarDataHoraBrasilia, somarMinutos } from '../../shared/utils/datas';
import { calcularPaginacao } from '../../shared/utils/paginacao';
import type { NotificacaoDados, NotificacoesRepositorio } from './notificacoes.repository';
import type { EntradaListarNotificacoes, EntradaMarcarComoLidas } from './notificacoes.schemas';

const MINUTOS_EM_24_HORAS = 24 * 60;

export interface DependenciasNotificacoesService {
  repositorio: NotificacoesRepositorio;
  gerarId?: () => string;
  agora?: () => Date;
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
    // RF19: os lembretes são gerados antes de listar, para já aparecerem na resposta.
    await this.gerarLembretes(usuarioId);
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

  /**
   * RF19: cria, sob demanda (sem cron), o lembrete das aulas confirmadas ou remarcadas do usuário
   * que começam nas próximas 24 h. A chaveUnica leva o horário de início: consultas repetidas não
   * duplicam o aviso, e uma aula remarcada gera um lembrete novo para o novo horário.
   */
  private async gerarLembretes(usuarioId: string): Promise<void> {
    const agora = this.agora();
    const aulas = await this.deps.repositorio.listarAulasProximas(
      usuarioId,
      agora,
      somarMinutos(agora, MINUTOS_EM_24_HORAS),
    );
    await this.deps.repositorio.criarLembretes(
      aulas.map((aula) => {
        const outraParte = aula.alunoId === usuarioId ? aula.professorNome : aula.alunoNome;
        return {
          usuarioId,
          aulaId: aula.id,
          tipo: 'LEMBRETE' as const,
          mensagem: `Lembrete: aula de ${aula.materiaNome} com ${outraParte} em ${formatarDataHoraBrasilia(aula.inicio)}.`,
          chaveUnica: `lembrete:${aula.id}:${usuarioId}:${aula.inicio.getTime()}`,
        };
      }),
    );
  }

  private gerarId(): string {
    return this.deps.gerarId ? this.deps.gerarId() : randomUUID();
  }

  private agora(): Date {
    return this.deps.agora ? this.deps.agora() : new Date();
  }
}
