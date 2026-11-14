import { afterEach, describe, expect, it } from 'vitest';
import { simularApi } from '../test/api-simulada';
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
} from './area-professor';

describe('serviço da área do professor (rotas e corpo enviados à API)', () => {
  let api: ReturnType<typeof simularApi>;
  afterEach(() => api.restaurar());

  it('obterMeuPerfil e salvarMeuPerfil usam /professores/me (RF04)', async () => {
    const perfil = { id: 'p1', completo: true };
    api = simularApi(perfil);
    const dados: DadosPerfil = {
      apresentacao: 'Professora de Física',
      valorHora: 80,
      modalidades: ['ONLINE'],
      materiaIds: ['m1'],
    };

    await expect(obterMeuPerfil()).resolves.toEqual(perfil);
    await expect(salvarMeuPerfil(dados)).resolves.toEqual(perfil);

    expect(api.chamadas.map((c) => [c.metodo, c.url, c.corpo])).toEqual([
      ['GET', '/professores/me', undefined],
      ['PUT', '/professores/me', dados],
    ]);
  });

  it('obterGrade e salvarGrade desembrulham { faixas } (RF05)', async () => {
    const faixas: FaixaHoraria[] = [{ diaSemana: 1, horaInicio: '08:00', horaFim: '10:00' }];
    api = simularApi({ faixas });

    await expect(obterGrade()).resolves.toEqual(faixas);
    await expect(salvarGrade(faixas)).resolves.toEqual(faixas);

    expect(api.chamadas.map((c) => [c.metodo, c.url, c.corpo])).toEqual([
      ['GET', '/professores/me/disponibilidade', undefined],
      ['PUT', '/professores/me/disponibilidade', { faixas }],
    ]);
  });

  it('lista, cria e remove bloqueios (RF06)', async () => {
    const bloqueio = { id: 'b/1', inicio: '2026-11-20T08:00', fim: '2026-11-20T12:00', motivo: 'Consulta' };
    api = simularApi(({ metodo }) => (metodo === 'GET' ? { itens: [bloqueio] } : bloqueio));

    await expect(listarBloqueios()).resolves.toEqual([bloqueio]);
    await expect(criarBloqueio({ inicio: bloqueio.inicio, fim: bloqueio.fim, motivo: 'Consulta' })).resolves.toEqual(
      bloqueio,
    );
    await expect(removerBloqueio('b/1')).resolves.toBeUndefined();

    expect(api.chamadas.map((c) => [c.metodo, c.url])).toEqual([
      ['GET', '/professores/me/bloqueios'],
      ['POST', '/professores/me/bloqueios'],
      ['DELETE', '/professores/me/bloqueios/b%2F1'],
    ]);
    expect(api.chamadas[1].corpo).toEqual({ inicio: bloqueio.inicio, fim: bloqueio.fim, motivo: 'Consulta' });
  });
});
