import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { buscarProfessor, buscarProfessores, listarMaterias, type FiltrosBusca } from '../services/professores';

export function useProfessores(filtros: FiltrosBusca) {
  return useQuery({
    queryKey: ['professores', filtros],
    queryFn: () => buscarProfessores(filtros),
    // Ao trocar de página, mantém os resultados anteriores até os novos chegarem.
    placeholderData: keepPreviousData,
  });
}

export function useProfessor(id: string) {
  return useQuery({
    queryKey: ['professor', id],
    queryFn: () => buscarProfessor(id),
  });
}

export function useMaterias() {
  return useQuery({
    queryKey: ['materias'],
    queryFn: listarMaterias,
    staleTime: 1000 * 60 * 10, // a lista de matérias muda pouco
  });
}
