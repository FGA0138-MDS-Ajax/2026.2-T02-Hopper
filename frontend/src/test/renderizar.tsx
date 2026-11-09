import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

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
}

/** Renderiza a tela com React Query (sem novas tentativas) e um roteador em memória. */
export function renderizar(tela: ReactElement, { url = '/', caminho = '/' }: OpcoesRenderizar = {}) {
  const clienteQuery = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={clienteQuery}>
      <MemoryRouter initialEntries={[url]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path={caminho} element={tela} />
          <Route path="*" element={null} />
        </Routes>
        <LocalAtual />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
