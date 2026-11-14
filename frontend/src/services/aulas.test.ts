import { afterEach, describe, expect, it } from 'vitest';
import { simularApi } from '../test/api-simulada';
import { aceitarAula, listarAulas, obterAula, recusarAula, solicitarAula, type DadosSolicitacao } from './aulas';

describe('serviço de aulas (rotas e corpo enviados à API)', () => {
  let api: ReturnType<typeof simularApi>;
  afterEach(() => api.restaurar());

  it('listarAulas envia os filtros como query string e devolve a página (RF17/RF18)', async () => {
    const pagina = { itens: [], total: 0, pagina: 2 };
    api = simularApi(pagina);

    await expect(listarAulas({ status: 'CONFIRMADA', pagina: 2, limite: 10 })).resolves.toEqual(pagina);
    expect(api.unica()).toMatchObject({
      metodo: 'GET',
      url: '/aulas',
      params: { status: 'CONFIRMADA', pagina: 2, limite: 10 },
    });
  });

  it('obterAula codifica o id na rota', async () => {
    api = simularApi({ id: 'a/1' });

    await expect(obterAula('a/1')).resolves.toEqual({ id: 'a/1' });
    expect(api.unica()).toMatchObject({ metodo: 'GET', url: '/aulas/a%2F1' });
  });

  it('aceitarAula aceita só a aula ou a série inteira (RF10/RF11)', async () => {
    api = simularApi({ id: 'a1', status: 'CONFIRMADA' });

    await aceitarAula('a1');
    await aceitarAula('a1', { serie: true });

    expect(api.chamadas.map(({ metodo, url, corpo }) => ({ metodo, url, corpo }))).toEqual([
      { metodo: 'PATCH', url: '/aulas/a1/aceitar', corpo: undefined },
      { metodo: 'PATCH', url: '/aulas/a1/aceitar', corpo: { serie: true } },
    ]);
  });

  it('recusarAula envia o motivo só quando informado', async () => {
    api = simularApi({ id: 'a1', status: 'RECUSADA' });

    await recusarAula('a1', 'Sem horário');
    await recusarAula('a1');

    expect(api.chamadas.map((c) => [c.metodo, c.url, c.corpo])).toEqual([
      ['PATCH', '/aulas/a1/recusar', { motivo: 'Sem horário' }],
      ['PATCH', '/aulas/a1/recusar', {}],
    ]);
  });

  it('solicitarAula envia o pedido e devolve as aulas criadas (RF09/RF10)', async () => {
    const criadas = [{ id: 'a1' }, { id: 'a2' }];
    api = simularApi({ itens: criadas });
    const dados: DadosSolicitacao = {
      professorId: 'p1',
      materiaId: 'm1',
      inicio: '2026-11-20T08:00:00.000-03:00',
      fim: '2026-11-20T09:00:00.000-03:00',
      modalidade: 'ONLINE',
      recorrencia: { semanas: 2 },
    };

    await expect(solicitarAula(dados)).resolves.toEqual(criadas);
    expect(api.unica()).toMatchObject({ metodo: 'POST', url: '/aulas', corpo: dados });
  });
});
