import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// O sino do cabeçalho consulta os avisos em toda tela logada. Nos testes, a resposta padrão é
// "nenhum aviso"; os testes de notificações trocam esta resposta com vi.mocked(...).
vi.mock('../services/notificacoes', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../services/notificacoes')>()),
  listarNotificacoes: vi.fn(async () => ({ itens: [], total: 0, pagina: 1, naoLidas: 0 })),
  marcarComoLidas: vi.fn(async () => 0),
}));

// jsdom não implementa rolagem; o componente RolarParaOTopo usa as duas.
Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
Element.prototype.scrollIntoView = vi.fn();
