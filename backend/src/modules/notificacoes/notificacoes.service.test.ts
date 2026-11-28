import type { Mocked } from 'vitest';
import type { Transacao } from '../../infra/prisma';
import type { NotificacoesRepositorio } from './notificacoes.repository';
import { NotificacoesService } from './notificacoes.service';
import { criarDataBrasilia } from '../../shared/utils/datas';

const tx = {} as Transacao;

function criarRepositorio(): Mocked<NotificacoesRepositorio> {
  return {
    criar: vi.fn().mockResolvedValue(undefined),
    listar: vi.fn().mockResolvedValue({ itens: [], total: 0 }),
    contarNaoLidas: vi.fn().mockResolvedValue(0),
    marcarComoLidas: vi.fn().mockResolvedValue(0),
    listarAulasProximas: vi.fn().mockResolvedValue([]),
    criarLembretes: vi.fn().mockResolvedValue(0),
  };
}

function criarServico(repositorio = criarRepositorio()) {
  const servico = new NotificacoesService({ repositorio, gerarId: () => 'id-fixo' });
  return { servico, repositorio };
}

describe('NotificacoesService', () => {
  describe('notificar', () => {
    it('grava a notificacao na transacao recebida com chave unica gerada', async () => {
      const { servico, repositorio } = criarServico();

      await servico.notificar(tx, {
        usuarioId: 'u1',
        aulaId: 'a1',
        tipo: 'SOLICITACAO',
        mensagem: 'Nova solicitação',
      });

      expect(repositorio.criar).toHaveBeenCalledWith(tx, {
        usuarioId: 'u1',
        aulaId: 'a1',
        tipo: 'SOLICITACAO',
        mensagem: 'Nova solicitação',
        chaveUnica: 'solicitacao:a1:u1:id-fixo',
      });
    });

    it('aceita notificacao sem aula e respeita a chave unica informada', async () => {
      const { servico, repositorio } = criarServico();

      await servico.notificar(tx, {
        usuarioId: 'u1',
        tipo: 'LEMBRETE',
        mensagem: 'Lembrete',
        chaveUnica: 'lembrete:a1:u1',
      });
      await servico.notificar(tx, { usuarioId: 'u2', tipo: 'CANCELAMENTO', mensagem: 'x' });

      expect(repositorio.criar.mock.calls[0][1]).toMatchObject({
        aulaId: null,
        chaveUnica: 'lembrete:a1:u1',
      });
      expect(repositorio.criar.mock.calls[1][1].chaveUnica).toBe(
        'cancelamento:sem-aula:u2:id-fixo',
      );
    });

    it('usa um identificador aleatorio quando nenhum gerador e informado', async () => {
      const repositorio = criarRepositorio();
      const servico = new NotificacoesService({ repositorio });
      await servico.notificar(tx, { usuarioId: 'u1', tipo: 'RECUSA', mensagem: 'x' });
      await servico.notificar(tx, { usuarioId: 'u1', tipo: 'RECUSA', mensagem: 'x' });
      expect(repositorio.criar.mock.calls[0][1].chaveUnica).not.toBe(
        repositorio.criar.mock.calls[1][1].chaveUnica,
      );
    });
  });

  describe('listar', () => {
    it('devolve itens, total, pagina e contagem de nao lidas', async () => {
      const { servico, repositorio } = criarServico();
      const itens = [
        {
          id: 'n1',
          aulaId: 'a1',
          tipo: 'CONFIRMACAO' as const,
          mensagem: 'Aula confirmada',
          lida: false,
          criadoEm: new Date('2026-11-06T12:00:00Z'),
        },
      ];
      repositorio.listar.mockResolvedValue({ itens, total: 12 });
      repositorio.contarNaoLidas.mockResolvedValue(4);

      const resultado = await servico.listar('u1', { pagina: 2, limite: 5, apenasNaoLidas: true });

      expect(repositorio.listar).toHaveBeenCalledWith(
        'u1',
        { apenasNaoLidas: true },
        { pagina: 2, limite: 5, pular: 5 },
      );
      expect(resultado).toEqual({ itens, total: 12, pagina: 2, naoLidas: 4 });
    });
  });

  describe('marcarComoLidas', () => {
    it('marca somente os ids informados', async () => {
      const { servico, repositorio } = criarServico();
      repositorio.marcarComoLidas.mockResolvedValue(2);

      const resultado = await servico.marcarComoLidas('u1', { ids: ['n1', 'n2'] });

      expect(repositorio.marcarComoLidas).toHaveBeenCalledWith('u1', ['n1', 'n2']);
      expect(resultado).toEqual({ atualizadas: 2 });
    });

    it('marca todas quando nenhum id e informado', async () => {
      const { servico, repositorio } = criarServico();
      repositorio.marcarComoLidas.mockResolvedValue(7);

      const resultado = await servico.marcarComoLidas('u1', { todas: true });

      expect(repositorio.marcarComoLidas).toHaveBeenCalledWith('u1', null);
      expect(resultado.atualizadas).toBe(7);
    });
  });
});
describe('NotificacoesService - lembretes (RF19)', () => {
  const AGORA = criarDataBrasilia(2026, 11, 6, 10, 0);
  const INICIO = criarDataBrasilia(2026, 11, 7, 9, 0);
  const consulta = { pagina: 1, limite: 20, apenasNaoLidas: false };

  const aula = {
    id: 'a1',
    inicio: INICIO,
    materiaNome: 'Matemática',
    alunoId: 'u-aluno',
    alunoNome: 'Caio',
    professorUsuarioId: 'u-prof',
    professorNome: 'Ana',
  };

  function criarServicoComRelogio() {
    const repositorio = criarRepositorio();
    const servico = new NotificacoesService({
      repositorio,
      gerarId: () => 'id-fixo',
      agora: () => AGORA,
    });
    return { servico, repositorio };
  }

  it('busca as aulas que começam entre agora e 24 horas depois', async () => {
    const { servico, repositorio } = criarServicoComRelogio();

    await servico.listar('u-aluno', consulta);

    expect(repositorio.listarAulasProximas).toHaveBeenCalledWith(
      'u-aluno',
      AGORA,
      criarDataBrasilia(2026, 11, 7, 10, 0),
    );
  });

  it('cria o lembrete do aluno com o nome do professor e a chave do horário', async () => {
    const { servico, repositorio } = criarServicoComRelogio();
    repositorio.listarAulasProximas.mockResolvedValue([aula]);

    await servico.listar('u-aluno', consulta);

    expect(repositorio.criarLembretes).toHaveBeenCalledWith([
      {
        usuarioId: 'u-aluno',
        aulaId: 'a1',
        tipo: 'LEMBRETE',
        mensagem: 'Lembrete: aula de Matemática com Ana em 07/11/2026 às 09:00.',
        chaveUnica: `lembrete:a1:u-aluno:${INICIO.getTime()}`,
      },
    ]);
  });

  it('cria o lembrete do professor com o nome do aluno', async () => {
    const { servico, repositorio } = criarServicoComRelogio();
    repositorio.listarAulasProximas.mockResolvedValue([aula]);

    await servico.listar('u-prof', consulta);

    expect(repositorio.listarAulasProximas.mock.calls[0][0]).toBe('u-prof');
    expect(repositorio.criarLembretes).toHaveBeenCalledWith([
      expect.objectContaining({
        usuarioId: 'u-prof',
        tipo: 'LEMBRETE',
        mensagem: 'Lembrete: aula de Matemática com Caio em 07/11/2026 às 09:00.',
        chaveUnica: `lembrete:a1:u-prof:${INICIO.getTime()}`,
      }),
    ]);
  });

  it('não cria lembretes quando não há aulas nas próximas 24 horas', async () => {
    const { servico, repositorio } = criarServicoComRelogio();

    await servico.listar('u-aluno', consulta);

    expect(repositorio.criarLembretes).toHaveBeenCalledWith([]);
  });

  it('repete a mesma chave em consultas seguidas, para não duplicar o aviso', async () => {
    const { servico, repositorio } = criarServicoComRelogio();
    repositorio.listarAulasProximas.mockResolvedValue([aula]);

    await servico.listar('u-aluno', consulta);
    await servico.listar('u-aluno', consulta);

    const [primeira, segunda] = repositorio.criarLembretes.mock.calls;
    expect(primeira[0][0].chaveUnica).toBe(segunda[0][0].chaveUnica);
  });

  it('gera uma chave nova quando a aula é remarcada para outro horário', async () => {
    const { servico, repositorio } = criarServicoComRelogio();
    const remarcada = { ...aula, inicio: criarDataBrasilia(2026, 11, 7, 14, 0) };
    repositorio.listarAulasProximas
      .mockResolvedValueOnce([aula])
      .mockResolvedValueOnce([remarcada]);

    await servico.listar('u-aluno', consulta);
    await servico.listar('u-aluno', consulta);

    const [antes, depois] = repositorio.criarLembretes.mock.calls;
    expect(antes[0][0].chaveUnica).not.toBe(depois[0][0].chaveUnica);
  });

  it('gera os lembretes antes de listar as notificações', async () => {
    const { servico, repositorio } = criarServicoComRelogio();

    await servico.listar('u-aluno', consulta);

    expect(repositorio.criarLembretes.mock.invocationCallOrder[0]).toBeLessThan(
      repositorio.listar.mock.invocationCallOrder[0],
    );
  });
});
