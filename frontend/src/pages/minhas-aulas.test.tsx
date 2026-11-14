import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatarTelefone } from '../utils/formatacao';
import { removerToken, salvarToken } from '../services/api';
import { obterUsuarioAtual, type Usuario } from '../services/auth';
import {
  aceitarAula,
  listarAulas,
  obterAula,
  recusarAula,
  type Aula,
  type AulaDetalhe,
  type FiltrosAulas,
} from '../services/aulas';
import { renderizar } from '../test/renderizar';
import { PaginaMinhasAulas } from './minhas-aulas';

vi.mock('../services/auth', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../services/auth')>()),
  obterUsuarioAtual: vi.fn(),
}));
vi.mock('../services/aulas', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../services/aulas')>()),
  listarAulas: vi.fn(),
  obterAula: vi.fn(),
  aceitarAula: vi.fn(),
  recusarAula: vi.fn(),
}));

const usuarioMock = vi.mocked(obterUsuarioAtual);
const listarMock = vi.mocked(listarAulas);
const obterMock = vi.mocked(obterAula);
const aceitarMock = vi.mocked(aceitarAula);
const recusarMock = vi.mocked(recusarAula);

// "Agora" nos testes: segunda-feira, 09/11/2026, 09:00 em Brasília.
const AGORA = new Date('2026-11-09T09:00:00.000-03:00');

const CAIO: Usuario = { id: 'u1', nome: 'Caio Alves', email: 'caio@email.com', telefone: null, perfil: 'ALUNO' };
const ANA_USUARIO: Usuario = {
  id: 'up1',
  nome: 'Ana Souza',
  email: 'ana@email.com',
  telefone: null,
  perfil: 'PROFESSOR',
};

function aula(campos: Partial<Aula> = {}): Aula {
  return {
    id: 'a1',
    inicio: '2026-11-12T14:00:00.000-03:00',
    fim: '2026-11-12T15:00:00.000-03:00',
    modalidade: 'ONLINE',
    objetivo: 'Revisar funções',
    status: 'CONFIRMADA',
    serieId: null,
    motivoCancelamento: null,
    criadoEm: '2026-11-09T08:00:00.000-03:00',
    materia: { id: 'm2', nome: 'Matemática', nivel: 'Ensino Médio' },
    aluno: { id: 'u1', nome: 'Caio Alves' },
    professor: { id: 'p1', usuarioId: 'up1', nome: 'Ana Souza' },
    ...campos,
  };
}

function pagina(itens: Aula[]) {
  return { itens, total: itens.length, pagina: 1 };
}

function erroApi(status: number, codigo: string, mensagem: string): AxiosError {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
  return new AxiosError('falha', 'ERR', config, undefined, {
    status,
    statusText: '',
    headers: {},
    config,
    data: { erro: { codigo, mensagem, detalhes: null } },
  });
}

function abrir(url = '/minhas-aulas') {
  return renderizar(<PaginaMinhasAulas />, { url, caminho: '/minhas-aulas' });
}

/** Responde a listagem conforme o status pedido. */
function listarPorStatus(porStatus: Partial<Record<string, Aula[]>>) {
  listarMock.mockImplementation(async (filtros: FiltrosAulas) => pagina(porStatus[filtros.status ?? 'TODAS'] ?? []));
}

describe('PaginaMinhasAulas', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(AGORA);
    salvarToken('token');
  });

  afterEach(() => {
    vi.useRealTimers();
    removerToken();
  });

  describe('como aluno', () => {
    beforeEach(() => usuarioMock.mockResolvedValue(CAIO));

    it('abre nas próximas aulas confirmadas, a partir de agora', async () => {
      listarPorStatus({ CONFIRMADA: [aula()] });
      abrir();

      const cartao = await screen.findByRole('article', { name: /Aula de Matemática, com Ana Souza/ });
      expect(listarMock).toHaveBeenCalledWith({
        status: 'CONFIRMADA',
        de: AGORA.toISOString(),
        pagina: 1,
        limite: 10,
      });
      expect(screen.getByRole('tab', { name: 'Próximas' })).toHaveAttribute('aria-selected', 'true');
      expect(within(cartao).getByText('Confirmada')).toBeInTheDocument();
      expect(within(cartao).getByText('14h às 15h')).toBeInTheDocument();
      expect(within(cartao).getByText('“Revisar funções”')).toBeInTheDocument();
      expect(within(cartao).queryByText('Aula semanal')).not.toBeInTheDocument();
    });

    it('identifica as aulas que fazem parte de uma série semanal (RF10)', async () => {
      listarPorStatus({ CONFIRMADA: [aula({ serieId: 's1' })] });
      abrir();

      const cartao = await screen.findByRole('article', { name: /Aula de Matemática/ });
      expect(within(cartao).getByText('Aula semanal')).toBeInTheDocument();
    });

    it('mostra as próximas aulas na ordem do calendário', async () => {
      listarPorStatus({
        CONFIRMADA: [
          aula({ id: 'tarde', inicio: '2026-11-20T14:00:00.000-03:00', fim: '2026-11-20T15:00:00.000-03:00' }),
          aula({ id: 'cedo', inicio: '2026-11-10T08:00:00.000-03:00', fim: '2026-11-10T09:00:00.000-03:00' }),
        ],
      });
      abrir();

      const cartoes = await screen.findAllByRole('article');
      expect(within(cartoes[0]).getByText('8h às 9h')).toBeInTheDocument();
      expect(within(cartoes[1]).getByText('14h às 15h')).toBeInTheDocument();
    });

    it('troca de aba e guarda a escolha na URL', async () => {
      listarPorStatus({ SOLICITADA: [aula({ status: 'SOLICITADA' })] });
      abrir();
      await screen.findByText(/Nenhuma aula confirmada/);

      await userEvent.click(screen.getByRole('tab', { name: 'Aguardando resposta' }));

      expect(await screen.findByText('Solicitada')).toBeInTheDocument();
      expect(screen.getByTestId('local-atual')).toHaveTextContent('/minhas-aulas?aba=pendentes');
      // Aluno não vê os botões de responder.
      expect(screen.queryByRole('button', { name: 'Aceitar' })).not.toBeInTheDocument();
    });

    it('as setas do teclado movem entre as abas', async () => {
      listarPorStatus({});
      abrir();
      const proximas = await screen.findByRole('tab', { name: 'Próximas' });
      proximas.focus();

      await userEvent.keyboard('{ArrowRight}');

      expect(screen.getByRole('tab', { name: 'Aguardando resposta' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: 'Aguardando resposta' })).toHaveFocus();
    });

    it('sem aulas, explica e sugere encontrar professores', async () => {
      listarPorStatus({});
      abrir();

      expect(await screen.findByText(/Nenhuma aula confirmada por enquanto/)).toBeInTheDocument();
      const painel = screen.getByRole('tabpanel');
      expect(within(painel).getByRole('link', { name: 'Encontrar professores' })).toHaveAttribute(
        'href',
        '/professores',
      );
    });

    it('nos detalhes de uma aula confirmada, mostra o contato do professor e o histórico', async () => {
      listarPorStatus({ CONFIRMADA: [aula()] });
      const detalhe: AulaDetalhe = {
        ...aula(),
        anotacoes: null,
        contato: { nome: 'Ana Souza', email: 'ana@email.com', telefone: '61991110001' },
        historico: [
          { status: 'SOLICITADA', dataHora: '2026-11-09T08:00:00.000-03:00', motivo: null, autorId: 'u1' },
          { status: 'CONFIRMADA', dataHora: '2026-11-09T08:30:00.000-03:00', motivo: null, autorId: 'up1' },
        ],
      };
      obterMock.mockResolvedValue(detalhe);
      abrir();

      await userEvent.click(await screen.findByRole('button', { name: 'Ver detalhes' }));

      expect(await screen.findByRole('link', { name: 'ana@email.com' })).toHaveAttribute(
        'href',
        'mailto:ana@email.com',
      );
      expect(screen.getByRole('link', { name: '(61) 99111-0001' })).toHaveAttribute('href', 'tel:+5561991110001');
      const historico = screen.getByRole('region', { name: 'Histórico da aula' });
      expect(within(historico).getByText('em 09/11 às 8h30')).toBeInTheDocument();
    });

    it('nos detalhes de um pedido, avisa que o contato só aparece depois da confirmação', async () => {
      listarPorStatus({ SOLICITADA: [aula({ status: 'SOLICITADA' })] });
      obterMock.mockResolvedValue({ ...aula({ status: 'SOLICITADA' }), anotacoes: null, contato: null, historico: [] });
      abrir('/minhas-aulas?aba=pendentes');

      await userEvent.click(await screen.findByRole('button', { name: 'Ver detalhes' }));

      expect(await screen.findByText('O contato aparece depois que a aula for confirmada.')).toBeInTheDocument();
    });
  });

  describe('como professor', () => {
    beforeEach(() => usuarioMock.mockResolvedValue(ANA_USUARIO));

    it('abre nos pedidos para responder, com a contagem na aba', async () => {
      listarPorStatus({ SOLICITADA: [aula({ status: 'SOLICITADA' })] });
      abrir();

      const aba = await screen.findByRole('tab', { name: /Pedidos para responder/ });
      expect(aba).toHaveAttribute('aria-selected', 'true');
      await waitFor(() => expect(aba).toHaveTextContent('1 pendentes'));
      expect(await screen.findByRole('article', { name: /Aluno: Caio Alves/ })).toBeInTheDocument();
    });

    it('aceita um pedido e confirma com uma mensagem', async () => {
      listarPorStatus({ SOLICITADA: [aula({ status: 'SOLICITADA' })] });
      aceitarMock.mockResolvedValue({ ...aula(), anotacoes: null, contato: null, historico: [] });
      abrir();

      await userEvent.click(await screen.findByRole('button', { name: 'Aceitar' }));

      expect(aceitarMock).toHaveBeenCalledWith('a1');
      expect(screen.queryByRole('button', { name: 'Aceitar a série inteira' })).not.toBeInTheDocument();
      expect(await screen.findByRole('status')).toHaveTextContent(
        'Aula com Caio Alves confirmada. O horário ficou reservado e o aluno foi avisado.',
      );
    });

    it('numa aula semanal, aceita a série inteira de uma vez (RF10)', async () => {
      listarPorStatus({ SOLICITADA: [aula({ status: 'SOLICITADA', serieId: 's1' })] });
      aceitarMock.mockResolvedValue({ ...aula(), anotacoes: null, contato: null, historico: [] });
      abrir();

      expect(await screen.findByRole('button', { name: 'Aceitar esta aula' })).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Aceitar a série inteira' }));

      expect(aceitarMock).toHaveBeenCalledWith('a1', { serie: true });
      expect(await screen.findByRole('status')).toHaveTextContent('Aulas semanais com Caio Alves confirmadas.');
    });

    it('recusa um pedido informando o motivo', async () => {
      listarPorStatus({ SOLICITADA: [aula({ status: 'SOLICITADA' })] });
      recusarMock.mockResolvedValue({ ...aula({ status: 'RECUSADA' }), anotacoes: null, contato: null, historico: [] });
      abrir();

      await userEvent.click(await screen.findByRole('button', { name: 'Recusar' }));
      await userEvent.type(screen.getByLabelText(/Motivo da recusa/), 'Sem disponibilidade nesse dia');
      await userEvent.click(screen.getByRole('button', { name: 'Confirmar recusa' }));

      expect(recusarMock).toHaveBeenCalledWith('a1', 'Sem disponibilidade nesse dia');
      expect(await screen.findByRole('status')).toHaveTextContent('Pedido de Caio Alves recusado.');
    });

    it('mostra o conflito quando o horário já foi confirmado para outro aluno', async () => {
      listarPorStatus({ SOLICITADA: [aula({ status: 'SOLICITADA' })] });
      aceitarMock.mockRejectedValue(erroApi(409, 'CONFLITO_DE_HORARIO', 'Já existe uma aula confirmada neste horário'));
      abrir();

      await userEvent.click(await screen.findByRole('button', { name: 'Aceitar' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Já existe uma aula confirmada neste horário');
    });
  });

  it('administrador não tem aulas', async () => {
    usuarioMock.mockResolvedValue({ ...CAIO, perfil: 'ADMIN' });
    abrir();
    expect(await screen.findByText('Contas de administrador não participam de aulas.')).toBeInTheDocument();
  });
});

describe('formatarTelefone', () => {
  it('formata celular e fixo com DDD', () => {
    expect(formatarTelefone('61991110001')).toBe('(61) 99111-0001');
    expect(formatarTelefone('6133334444')).toBe('(61) 3333-4444');
  });
});
