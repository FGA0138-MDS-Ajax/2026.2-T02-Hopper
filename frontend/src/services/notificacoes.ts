import { api } from './api';

export type TipoNotificacao = 'SOLICITACAO' | 'CONFIRMACAO' | 'RECUSA' | 'REMARCACAO' | 'CANCELAMENTO' | 'LEMBRETE';

/** Aviso exibido na aplicação (RF13). Datas em ISO 8601 no horário de Brasília. */
export interface Notificacao {
  id: string;
  aulaId: string | null;
  tipo: TipoNotificacao;
  mensagem: string;
  lida: boolean;
  criadoEm: string;
}

export interface FiltrosNotificacoes {
  apenasNaoLidas?: boolean;
  pagina?: number;
  limite?: number;
}

export interface PaginaDeNotificacoes {
  itens: Notificacao[];
  total: number;
  pagina: number;
  /** Total de não lidas do usuário, independente do filtro. */
  naoLidas: number;
}

/** RF13: avisos do usuário logado, do mais recente para o mais antigo. */
export async function listarNotificacoes(filtros: FiltrosNotificacoes): Promise<PaginaDeNotificacoes> {
  const { apenasNaoLidas, ...resto } = filtros;
  const { data } = await api.get<PaginaDeNotificacoes>('/notificacoes', {
    params: apenasNaoLidas ? { ...resto, apenasNaoLidas: 'true' } : resto,
  });
  return data;
}

/** Marca como lidas as notificações informadas ou, sem ids, todas as do usuário. */
export async function marcarComoLidas(ids?: string[]): Promise<number> {
  const { data } = await api.patch<{ atualizadas: number }>('/notificacoes', ids ? { ids } : { todas: true });
  return data.atualizadas;
}
