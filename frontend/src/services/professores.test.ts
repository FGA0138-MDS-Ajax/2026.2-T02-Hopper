import { afterEach, describe, expect, it } from 'vitest';
import { api } from './api';
import { buscarProfessor, buscarProfessores, listarMaterias } from './professores';

describe('serviço de professores (formato das respostas da API)', () => {
  const adaptadorOriginal = api.defaults.adapter;
  afterEach(() => {
    api.defaults.adapter = adaptadorOriginal;
  });

  it('listarMaterias desembrulha { itens } da resposta', async () => {
    const materias = [{ id: 'm1', nome: 'Física', nivel: 'Ensino Médio' }];
    let rota: string | undefined;
    api.defaults.adapter = async (config) => {
      rota = config.url;
      return { data: { itens: materias }, status: 200, statusText: 'OK', headers: {}, config };
    };

    await expect(listarMaterias()).resolves.toEqual(materias);
    expect(rota).toBe('/materias');
  });

  it('buscarProfessores envia os filtros como query string e devolve a página', async () => {
    const pagina = { itens: [], total: 0, pagina: 1 };
    let parametros: unknown;
    api.defaults.adapter = async (config) => {
      parametros = config.params;
      return { data: pagina, status: 200, statusText: 'OK', headers: {}, config };
    };

    await expect(buscarProfessores({ materia: 'Física', limite: 6 })).resolves.toEqual(pagina);
    expect(parametros).toEqual({ materia: 'Física', limite: 6 });
  });

  it('buscarProfessor codifica o id na rota e devolve o perfil com os horários livres', async () => {
    const professor = { id: 'p/1', nome: 'Ana', horariosLivres: [] };
    let rota: string | undefined;
    api.defaults.adapter = async (config) => {
      rota = config.url;
      return { data: professor, status: 200, statusText: 'OK', headers: {}, config };
    };

    await expect(buscarProfessor('p/1')).resolves.toEqual(professor);
    expect(rota).toBe('/professores/p%2F1');
  });
});
