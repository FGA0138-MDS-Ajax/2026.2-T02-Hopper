import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  aceitarAula,
  cancelarAula,
  listarAulas,
  obterAula,
  proporRemarcacao,
  recusarAula,
  responderRemarcacao,
  type FiltrosAulas,
} from '../services/aulas';

export function useAulas(filtros: FiltrosAulas, habilitado = true) {
  return useQuery({
    queryKey: ['aulas', filtros],
    queryFn: () => listarAulas(filtros),
    placeholderData: keepPreviousData,
    enabled: habilitado,
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
    mutationFn: ({ id, serie }: { id: string; serie?: boolean }) =>
      serie ? aceitarAula(id, { serie: true }) : aceitarAula(id),
    onSuccess: (_aula, { id }) => atualizar(id),
  });
}

export function useRecusarAula() {
  const atualizar = useAtualizarAulas();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo?: string }) => recusarAula(id, motivo),
    onSuccess: (_aula, { id }) => atualizar(id),
  });
}

export function useCancelarAula() {
  const atualizar = useAtualizarAulas();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) => cancelarAula(id, motivo),
    onSuccess: (_aula, { id }) => atualizar(id),
  });
}

export function useProporRemarcacao() {
  const atualizar = useAtualizarAulas();
  return useMutation({
    mutationFn: ({ aulaId, dados }: { aulaId: string; dados: { novoInicio: string; novoFim: string } }) =>
      proporRemarcacao(aulaId, dados),
    onSuccess: (_remarcacao, { aulaId }) => atualizar(aulaId),
  });
}

export function useResponderRemarcacao() {
  const atualizar = useAtualizarAulas();
  return useMutation({
    mutationFn: ({ aulaId, remarcacaoId, aceita }: { aulaId: string; remarcacaoId: string; aceita: boolean }) =>
      responderRemarcacao(aulaId, remarcacaoId, aceita),
    onSuccess: (_aula, { aulaId }) => atualizar(aulaId),
  });
}
