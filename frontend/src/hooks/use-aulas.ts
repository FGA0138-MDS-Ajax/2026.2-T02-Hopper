import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aceitarAula, listarAulas, obterAula, recusarAula, type FiltrosAulas } from '../services/aulas';

export function useAulas(filtros: FiltrosAulas) {
  return useQuery({
    queryKey: ['aulas', filtros],
    queryFn: () => listarAulas(filtros),
    placeholderData: keepPreviousData,
  });
}

export function useAula(id: string, habilitado: boolean) {
  return useQuery({
    queryKey: ['aula', id],
    queryFn: () => obterAula(id),
    enabled: habilitado,
  });
}

/** Depois de aceitar ou recusar, as listas e o detalhe da aula são buscados de novo. */
function useAtualizarAulas() {
  const clienteQuery = useQueryClient();
  return (id: string) =>
    Promise.all([
      clienteQuery.invalidateQueries({ queryKey: ['aulas'] }),
      clienteQuery.invalidateQueries({ queryKey: ['aula', id] }),
    ]);
}

export function useAceitarAula() {
  const atualizar = useAtualizarAulas();
  return useMutation({
    mutationFn: (id: string) => aceitarAula(id),
    onSuccess: (_aula, id) => atualizar(id),
  });
}

export function useRecusarAula() {
  const atualizar = useAtualizarAulas();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo?: string }) => recusarAula(id, motivo),
    onSuccess: (_aula, { id }) => atualizar(id),
  });
}
