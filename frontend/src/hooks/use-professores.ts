import { useQuery } from '@tanstack/react-query';
import { buscarProfessores, listarMaterias, type FiltrosBusca } from '../services/professores';

export function useProfessores(filtros: FiltrosBusca) {
  return useQuery({
    queryKey: ['professores', filtros],
    queryFn: () => buscarProfessores(filtros),
  });
}

export function useMaterias() {
  return useQuery({
    queryKey: ['materias'],
    queryFn: listarMaterias,
    staleTime: 1000 * 60 * 10, // a lista de matérias muda pouco
  });
}
