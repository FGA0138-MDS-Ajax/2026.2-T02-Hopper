import type { Transacao } from '../../infra/prisma';
import type { NotificacoesRepositorio } from './notificacoes.repository';
import { NotificacoesService } from './notificacoes.service';

const tx = {} as Transacao;

function criarRepositorio(): jest.Mocked<NotificacoesRepositorio> {
  return {
    criar: jest.fn().mockResolvedValue(undefined),
    listar: jest.fn().mockResolvedValue({ itens: [], total: 0 }),
    contarNaoLidas: jest.fn().mockResolvedValue(0),
    marcarComoLidas: jest.fn().mockResolvedValue(0),
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
