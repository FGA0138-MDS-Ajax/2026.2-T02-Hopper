import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listarNotificacoes, marcarComoLidas, type FiltrosNotificacoes } from '../services/notificacoes';

const CHAVE = 'notificacoes';
const LIMITE_LEMBRETES = 20;

/** De quanto em quanto tempo o contador do sino procura avisos novos. */
const INTERVALO_DE_ATUALIZACAO_MS = 60_000;

export function useNotificacoes(filtros: FiltrosNotificacoes) {
  return useQuery({
    queryKey: [CHAVE, filtros],
    queryFn: () => listarNotificacoes(filtros),
    placeholderData: keepPreviousData,
  });
}

/** RF19: lembretes não lidos de aulas confirmadas ou remarcadas nas próximas 24 h. */
export function useLembretes(habilitado = true) {
  return useQuery({
    queryKey: [CHAVE, 'lembretes'],
    queryFn: () => listarNotificacoes({ apenasNaoLidas: true, limite: LIMITE_LEMBRETES }),
    select: (pagina) => pagina.itens.filter((item) => item.tipo === 'LEMBRETE'),
    enabled: habilitado,
  });
}

/** Quantidade de avisos não lidos, para o sino do cabeçalho. Busca de novo a cada minuto e ao voltar para a aba. */
export function useContagemNaoLidas(habilitado: boolean) {
  return useQuery({
    queryKey: [CHAVE, 'contagem'],
    queryFn: () => listarNotificacoes({ apenasNaoLidas: true, limite: 1 }),
    select: (pagina) => pagina.naoLidas,
    enabled: habilitado,
    refetchInterval: INTERVALO_DE_ATUALIZACAO_MS,
    refetchOnWindowFocus: true,
  });
}

/** Sem ids, marca todas. Depois, a lista e o contador são buscados de novo. */
export function useMarcarComoLidas() {
  const clienteQuery = useQueryClient();
  return useMutation({
    mutationFn: (ids?: string[]) => marcarComoLidas(ids),
    onSuccess: () => clienteQuery.invalidateQueries({ queryKey: [CHAVE] }),
  });
}
