import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { lerToken, removerToken, salvarToken } from '../services/api';
import {
  cadastrar as cadastrarNaApi,
  entrar as entrarNaApi,
  obterUsuarioAtual,
  type DadosCadastro,
  type Usuario,
} from '../services/auth';

interface Sessao {
  /** Usuário logado, ou null para visitante. */
  usuario: Usuario | null;
  /** true enquanto um token salvo ainda está sendo validado na API. */
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<Usuario>;
  /** Cria a conta e já entra com ela. */
  cadastrar: (dados: DadosCadastro) => Promise<Usuario>;
  sair: () => void;
}

const ContextoSessao = createContext<Sessao | null>(null);

const CHAVE_SESSAO = 'sessao';

export function SessaoProvider({ children }: { children: ReactNode }) {
  const clienteQuery = useQueryClient();
  const [token, setToken] = useState<string | null>(() => lerToken());

  // Com um token salvo, confirma na API quem é o usuário (o token pode ter expirado).
  const { data, isPending } = useQuery({
    queryKey: [CHAVE_SESSAO, token],
    queryFn: obterUsuarioAtual,
    enabled: token !== null,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const entrar = useCallback(
    async (email: string, senha: string) => {
      const resultado = await entrarNaApi(email, senha);
      salvarToken(resultado.token);
      clienteQuery.setQueryData([CHAVE_SESSAO, resultado.token], resultado.usuario);
      setToken(resultado.token);
      return resultado.usuario;
    },
    [clienteQuery],
  );

  const cadastrar = useCallback(
    async (dados: DadosCadastro) => {
      await cadastrarNaApi(dados);
      return entrar(dados.email, dados.senha);
    },
    [entrar],
  );

  const sair = useCallback(() => {
    removerToken();
    setToken(null);
    clienteQuery.removeQueries({ queryKey: [CHAVE_SESSAO] });
  }, [clienteQuery]);

  const valor = useMemo<Sessao>(
    () => ({
      usuario: token ? (data ?? null) : null,
      carregando: token !== null && isPending,
      entrar,
      cadastrar,
      sair,
    }),
    [token, data, isPending, entrar, cadastrar, sair],
  );

  return <ContextoSessao.Provider value={valor}>{children}</ContextoSessao.Provider>;
}

export function useSessao(): Sessao {
  const sessao = useContext(ContextoSessao);
  if (!sessao) throw new Error('useSessao precisa estar dentro de <SessaoProvider>');
  return sessao;
}
