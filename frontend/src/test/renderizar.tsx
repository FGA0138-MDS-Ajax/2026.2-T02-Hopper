import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { SessaoProvider } from '../contexts/sessao';

/** Mostra a URL atual, para os testes conferirem para onde a navegação levou. */
function LocalAtual() {
  const { pathname, search } = useLocation();
  return <p data-testid="local-atual">{pathname + search}</p>;
}

interface OpcoesRenderizar {
  /** URL inicial (ex.: '/professores?materia=Física'). Padrão: '/'. */
  url?: string;
  /** Padrão de rota da tela (ex.: '/professores'). Padrão: '/'. */
  caminho?: string;
  /** Outras rotas da mesma árvore (ex.: a tela para onde a navegação leva). */
  outrasRotas?: { caminho: string; tela: ReactElement }[];
}

/** Renderiza a tela com React Query (sem novas tentativas), a sessão e um roteador em memória. */
export function renderizar(tela: ReactElement, { url = '/', caminho = '/', outrasRotas = [] }: OpcoesRenderizar = {}) {
  const clienteQuery = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={clienteQuery}>
      <SessaoProvider>
        <MemoryRouter initialEntries={[url]}>
          <Routes>
            <Route path={caminho} element={tela} />
            {outrasRotas.map((rota) => (
              <Route key={rota.caminho} path={rota.caminho} element={rota.tela} />
            ))}
            <Route path="*" element={null} />
          </Routes>
          <LocalAtual />
        </MemoryRouter>
      </SessaoProvider>
    </QueryClientProvider>,
  );
}
