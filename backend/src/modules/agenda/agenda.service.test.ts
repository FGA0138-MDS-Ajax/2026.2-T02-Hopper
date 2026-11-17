import type { Mocked } from 'vitest';
import { capturarErro } from '../../../tests/helpers/erros';
import { ErroNaoEncontrado, ErroProibido, ErroRegraNegocio } from '../../shared/errors';
import { componentesBrasilia, criarDataBrasilia } from '../../shared/utils/datas';
import type { AgendaRepositorio, BloqueioDados } from './agenda.repository';
import { AgendaService, type ProvedorDeOcupacao } from './agenda.service';

const AGORA = criarDataBrasilia(2026, 11, 6, 10, 0);
const SEGUNDA_9H = criarDataBrasilia(2026, 11, 9, 9);
const SEGUNDA_10H = criarDataBrasilia(2026, 11, 9, 10);

function criarRepositorio(): Mocked<AgendaRepositorio> {
  return {
    buscarProfessorIdPorUsuario: vi.fn().mockResolvedValue('p1'),
    listarGrade: vi.fn().mockResolvedValue([]),
    substituirGrade: vi.fn().mockResolvedValue(undefined),
    listarBloqueiosFuturos: vi.fn().mockResolvedValue([]),
    listarIntervalosBloqueados: vi.fn().mockResolvedValue([]),
    criarBloqueio: vi.fn(),
    buscarBloqueio: vi.fn(),
    removerBloqueio: vi.fn().mockResolvedValue(undefined),
  };
}

function criarServico(repositorio = criarRepositorio()) {
  const ocupacao: Mocked<ProvedorDeOcupacao> = {
    listarIntervalosOcupados: vi.fn().mockResolvedValue([]),
  };
  const servico = new AgendaService({ repositorio, ocupacao, agora: () => AGORA });
  return { servico, repositorio, ocupacao };
}

const gradeSegunda = [{ diaSemana: 1, horaInicio: '08:00', horaFim: '12:00' }];

describe('AgendaService', () => {
  describe('grade semanal', () => {
    it('substitui a grade e devolve a grade gravada', async () => {
      const { servico, repositorio } = criarServico();
      repositorio.listarGrade.mockResolvedValue(gradeSegunda);

      const resultado = await servico.substituirGrade('u1', { faixas: gradeSegunda });

      expect(repositorio.substituirGrade).toHaveBeenCalledWith('p1', gradeSegunda);
      expect(resultado).toEqual(gradeSegunda);
    });

    it('rejeita faixas sobrepostas no mesmo dia com 400', async () => {
      const { servico, repositorio } = criarServico();
      const erro = await capturarErro(
        servico.substituirGrade('u1', {
          faixas: [
            { diaSemana: 1, horaInicio: '08:00', horaFim: '10:00' },
            { diaSemana: 1, horaInicio: '09:00', horaFim: '11:00' },
          ],
        }),
      );
      expect(erro).toBeInstanceOf(ErroRegraNegocio);
      expect(repositorio.substituirGrade).not.toHaveBeenCalled();
    });

    it('permite faixas consecutivas e em dias diferentes', async () => {
      const { servico, repositorio } = criarServico();
      await servico.substituirGrade('u1', {
        faixas: [
          { diaSemana: 1, horaInicio: '08:00', horaFim: '10:00' },
          { diaSemana: 1, horaInicio: '10:00', horaFim: '12:00' },
          { diaSemana: 2, horaInicio: '08:00', horaFim: '10:00' },
        ],
      });
      expect(repositorio.substituirGrade).toHaveBeenCalled();
    });

    it('responde 404 quando o usuario nao tem perfil de professor', async () => {
      const { servico, repositorio } = criarServico();
      repositorio.buscarProfessorIdPorUsuario.mockResolvedValue(null);
      await expect(servico.obterGrade('u1')).rejects.toBeInstanceOf(ErroNaoEncontrado);
    });
  });

  describe('bloqueios', () => {
    it('cria bloqueio no futuro', async () => {
      const { servico, repositorio } = criarServico();
      repositorio.criarBloqueio.mockResolvedValue({
        id: 'b1',
        professorId: 'p1',
        inicio: SEGUNDA_9H,
        fim: SEGUNDA_10H,
        motivo: null,
      });
      const bloqueio = await servico.criarBloqueio('u1', { inicio: SEGUNDA_9H, fim: SEGUNDA_10H });
      expect(bloqueio.id).toBe('b1');
      expect(repositorio.criarBloqueio).toHaveBeenCalledWith('p1', {
        inicio: SEGUNDA_9H,
        fim: SEGUNDA_10H,
        motivo: null,
      });
    });

    it('rejeita bloqueio que comeca no passado', async () => {
      const { servico } = criarServico();
      const passado = criarDataBrasilia(2026, 11, 5, 9);
      await expect(
        servico.criarBloqueio('u1', { inicio: passado, fim: SEGUNDA_10H }),
      ).rejects.toBeInstanceOf(ErroRegraNegocio);
    });

    it('remove apenas bloqueio do proprio professor', async () => {
      const { servico, repositorio } = criarServico();
      const bloqueio: BloqueioDados = {
        id: 'b1',
        professorId: 'outro',
        inicio: SEGUNDA_9H,
        fim: SEGUNDA_10H,
        motivo: null,
      };
      repositorio.buscarBloqueio.mockResolvedValueOnce(bloqueio);
      await expect(servico.removerBloqueio('u1', 'b1')).rejects.toBeInstanceOf(ErroProibido);
      repositorio.buscarBloqueio.mockResolvedValueOnce({ ...bloqueio, professorId: 'p1' });
      await servico.removerBloqueio('u1', 'b1');
      expect(repositorio.removerBloqueio).toHaveBeenCalledWith('b1');
    });

    it('responde 404 para bloqueio inexistente', async () => {
      const { servico, repositorio } = criarServico();
      repositorio.buscarBloqueio.mockResolvedValue(null);
      await expect(servico.removerBloqueio('u1', 'b1')).rejects.toBeInstanceOf(ErroNaoEncontrado);
    });
  });

  describe('calcularHorariosLivres', () => {
    it('desconta bloqueios e aulas ocupadas da grade semanal', async () => {
      const { servico, repositorio, ocupacao } = criarServico();
      repositorio.listarGrade.mockResolvedValue(gradeSegunda);
      repositorio.listarIntervalosBloqueados.mockResolvedValue([
        { inicio: SEGUNDA_9H, fim: SEGUNDA_10H },
      ]);
      ocupacao.listarIntervalosOcupados.mockResolvedValue([
        { inicio: criarDataBrasilia(2026, 11, 9, 11), fim: criarDataBrasilia(2026, 11, 9, 12) },
      ]);

      const livres = await servico.calcularHorariosLivres(
        'p1',
        criarDataBrasilia(2026, 11, 9),
        criarDataBrasilia(2026, 11, 10),
      );

      expect(livres.map((item) => componentesBrasilia(item.inicio).hora)).toEqual([8, 10]);
    });

    it('nao inclui dias sem faixa na grade', async () => {
      const { servico, repositorio } = criarServico();
      repositorio.listarGrade.mockResolvedValue(gradeSegunda);
      const livres = await servico.calcularHorariosLivres(
        'p1',
        criarDataBrasilia(2026, 11, 10),
        criarDataBrasilia(2026, 11, 11),
      );
      expect(livres).toEqual([]);
    });
  });

  describe('estaLivre', () => {
    it('aceita horario dentro da grade, sem bloqueio nem aula', async () => {
      const { servico, repositorio } = criarServico();
      repositorio.listarGrade.mockResolvedValue(gradeSegunda);
      expect(await servico.estaLivre('p1', SEGUNDA_9H, SEGUNDA_10H)).toBe(true);
    });

    it('recusa horario fora da grade', async () => {
      const { servico, repositorio } = criarServico();
      repositorio.listarGrade.mockResolvedValue(gradeSegunda);
      const fora = criarDataBrasilia(2026, 11, 9, 14);
      expect(await servico.estaLivre('p1', fora, criarDataBrasilia(2026, 11, 9, 15))).toBe(false);
    });

    it('recusa horario bloqueado ou ocupado por aula', async () => {
      const { servico, repositorio, ocupacao } = criarServico();
      repositorio.listarGrade.mockResolvedValue(gradeSegunda);
      repositorio.listarIntervalosBloqueados.mockResolvedValueOnce([
        { inicio: SEGUNDA_9H, fim: SEGUNDA_10H },
      ]);
      expect(await servico.estaLivre('p1', SEGUNDA_9H, SEGUNDA_10H)).toBe(false);
      ocupacao.listarIntervalosOcupados.mockResolvedValueOnce([
        { inicio: SEGUNDA_9H, fim: SEGUNDA_10H },
      ]);
      expect(await servico.estaLivre('p1', SEGUNDA_9H, SEGUNDA_10H)).toBe(false);
    });

    it('permite aulas consecutivas (intervalo semiaberto)', async () => {
      const { servico, repositorio, ocupacao } = criarServico();
      repositorio.listarGrade.mockResolvedValue(gradeSegunda);
      ocupacao.listarIntervalosOcupados.mockResolvedValue([
        { inicio: SEGUNDA_9H, fim: SEGUNDA_10H },
      ]);
      const seguinte = criarDataBrasilia(2026, 11, 9, 11);
      expect(await servico.estaLivre('p1', SEGUNDA_10H, seguinte)).toBe(true);
    });

    it('recusa horario no passado e intervalo invertido', async () => {
      const { servico, repositorio } = criarServico();
      repositorio.listarGrade.mockResolvedValue(gradeSegunda);
      const passado = criarDataBrasilia(2026, 11, 2, 9);
      expect(await servico.estaLivre('p1', passado, criarDataBrasilia(2026, 11, 2, 10))).toBe(
        false,
      );
      expect(await servico.estaLivre('p1', SEGUNDA_10H, SEGUNDA_9H)).toBe(false);
    });
  });
});
