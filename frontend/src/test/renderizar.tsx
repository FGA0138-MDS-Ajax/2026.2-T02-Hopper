import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

/** Mostra para onde a navegação levou, para os testes conferirem a URL. */
function LocalAtual() {
  const { pathname, search } = useLocation();
  return <p data-testid="local-atual">{pathname + search}</p>;
}

/** Renderiza a tela com React Query (sem novas tentativas) e um roteador em memória. */
export function renderizar(tela: ReactElement) {
  const clienteQuery = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={clienteQuery}>
      <MemoryRouter initialEntries={['/']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={tela} />
          <Route path="*" element={<LocalAtual />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
