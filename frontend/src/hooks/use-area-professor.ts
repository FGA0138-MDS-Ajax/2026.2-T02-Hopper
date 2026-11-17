import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  criarBloqueio,
  listarBloqueios,
  obterGrade,
  obterMeuPerfil,
  removerBloqueio,
  salvarGrade,
  salvarMeuPerfil,
  type DadosPerfil,
  type FaixaHoraria,
} from '../services/area-professor';

const CHAVE = 'area-professor';

export function useMeuPerfil(habilitado = true) {
  return useQuery({ queryKey: [CHAVE, 'perfil'], queryFn: obterMeuPerfil, enabled: habilitado });
}

export function useGrade(habilitado = true) {
  return useQuery({ queryKey: [CHAVE, 'grade'], queryFn: obterGrade, enabled: habilitado });
}

export function useBloqueios() {
  return useQuery({ queryKey: [CHAVE, 'bloqueios'], queryFn: listarBloqueios });
}

/** Mudanças na área do professor também mudam o perfil público, a busca e os horários livres. */
function useAtualizar() {
  const clienteQuery = useQueryClient();
  return (parte: 'perfil' | 'grade' | 'bloqueios') =>
    Promise.all([
      clienteQuery.invalidateQueries({ queryKey: [CHAVE, parte] }),
      clienteQuery.invalidateQueries({ queryKey: ['professor'] }),
      clienteQuery.invalidateQueries({ queryKey: ['professores'] }),
    ]);
}

export function useSalvarPerfil() {
  const atualizar = useAtualizar();
  return useMutation({
    mutationFn: (dados: DadosPerfil) => salvarMeuPerfil(dados),
    onSuccess: () => atualizar('perfil'),
  });
}

export function useSalvarGrade() {
  const atualizar = useAtualizar();
  return useMutation({
    mutationFn: (faixas: FaixaHoraria[]) => salvarGrade(faixas),
    onSuccess: () => atualizar('grade'),
  });
}

export function useCriarBloqueio() {
  const atualizar = useAtualizar();
  return useMutation({
    mutationFn: (dados: Parameters<typeof criarBloqueio>[0]) => criarBloqueio(dados),
    onSuccess: () => atualizar('bloqueios'),
  });
}

export function useRemoverBloqueio() {
  const atualizar = useAtualizar();
  return useMutation({
    mutationFn: (id: string) => removerBloqueio(id),
    onSuccess: () => atualizar('bloqueios'),
  });
}
