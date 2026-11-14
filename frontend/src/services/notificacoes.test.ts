import { afterEach, describe, expect, it, vi } from 'vitest';
import { simularApi } from '../test/api-simulada';
import { listarNotificacoes, marcarComoLidas } from './notificacoes';

// O setup dos testes troca este serviço por uma resposta padrão (para o sino do cabeçalho);
// aqui o teste é do próprio serviço, então usa o módulo verdadeiro.
vi.unmock('./notificacoes');

describe('serviço de notificações (RF13)', () => {
  let api: ReturnType<typeof simularApi>;
  afterEach(() => api.restaurar());

  it('listarNotificacoes manda apenasNaoLidas como texto só quando pedido', async () => {
    const pagina = { itens: [], total: 0, pagina: 1, naoLidas: 3 };
    api = simularApi(pagina);

    await expect(listarNotificacoes({ apenasNaoLidas: true, pagina: 1 })).resolves.toEqual(pagina);
    await listarNotificacoes({ apenasNaoLidas: false, limite: 5 });

    expect(api.chamadas.map((c) => [c.metodo, c.url, c.params])).toEqual([
      ['GET', '/notificacoes', { pagina: 1, apenasNaoLidas: 'true' }],
      ['GET', '/notificacoes', { limite: 5 }],
    ]);
  });

  it('marcarComoLidas marca as informadas ou todas, e devolve quantas mudaram', async () => {
    api = simularApi({ atualizadas: 2 });

    await expect(marcarComoLidas(['n1', 'n2'])).resolves.toBe(2);
    await marcarComoLidas();

    expect(api.chamadas.map((c) => [c.metodo, c.url, c.corpo])).toEqual([
      ['PATCH', '/notificacoes', { ids: ['n1', 'n2'] }],
      ['PATCH', '/notificacoes', { todas: true }],
    ]);
  });
});
