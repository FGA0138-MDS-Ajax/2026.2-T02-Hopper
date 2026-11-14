import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listarNotificacoes, marcarComoLidas, type FiltrosNotificacoes } from '../services/notificacoes';

const CHAVE = 'notificacoes';

/** De quanto em quanto tempo o contador do sino procura avisos novos. */
const INTERVALO_DE_ATUALIZACAO_MS = 60_000;

export function useNotificacoes(filtros: FiltrosNotificacoes) {
  return useQuery({
    queryKey: [CHAVE, filtros],
    queryFn: () => listarNotificacoes(filtros),
    placeholderData: keepPreviousData,
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
