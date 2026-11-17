import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { removerToken, salvarToken } from '../services/api';
import { obterUsuarioAtual, type Usuario } from '../services/auth';
import {
  listarNotificacoes,
  marcarComoLidas,
  type FiltrosNotificacoes,
  type Notificacao,
} from '../services/notificacoes';
import { renderizar } from '../test/renderizar';
import { PaginaNotificacoes } from './notificacoes';

// O serviço de notificações já vem simulado pelo test/setup.ts.
vi.mock('../services/auth', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../services/auth')>()),
  obterUsuarioAtual: vi.fn(),
}));

const listarMock = vi.mocked(listarNotificacoes);
const marcarMock = vi.mocked(marcarComoLidas);

const CAIO: Usuario = { id: 'u1', nome: 'Caio Alves', email: 'caio@email.com', telefone: null, perfil: 'ALUNO' };

const CONFIRMACAO: Notificacao = {
  id: 'n1',
  aulaId: 'a1',
  tipo: 'CONFIRMACAO',
  mensagem: 'Ana Souza confirmou a sua aula de Matemática em 12/11/2026 às 14:00.',
  lida: false,
  criadoEm: '2026-11-10T09:30:00.000-03:00',
};

const RECUSA: Notificacao = {
  id: 'n2',
  aulaId: 'a2',
  tipo: 'RECUSA',
  mensagem: 'Ana Souza recusou a sua aula de Física em 13/11/2026 às 10:00.',
  lida: true,
  criadoEm: '2026-11-09T18:00:00.000-03:00',
};

/** Responde como a API: filtra as não lidas quando pedido e sempre informa o total de não lidas. */
function responderCom(avisos: Notificacao[]) {
  listarMock.mockImplementation(async (filtros: FiltrosNotificacoes) => {
    const itens = filtros.apenasNaoLidas ? avisos.filter((aviso) => !aviso.lida) : avisos;
    return {
      itens: itens.slice(0, filtros.limite ?? 10),
      total: itens.length,
      pagina: filtros.pagina ?? 1,
      naoLidas: avisos.filter((aviso) => !aviso.lida).length,
    };
  });
}

function abrir(url = '/notificacoes') {
  return renderizar(<PaginaNotificacoes />, { url, caminho: '/notificacoes' });
}

describe('PaginaNotificacoes', () => {
  beforeEach(() => {
    salvarToken('token-do-caio');
    vi.mocked(obterUsuarioAtual).mockResolvedValue(CAIO);
    responderCom([CONFIRMACAO, RECUSA]);
    marcarMock.mockResolvedValue(1);
  });

  afterEach(() => removerToken());

  it('lista os avisos, destaca os não lidos e leva até a aula', async () => {
    abrir();

    const lista = await screen.findByRole('list');
    const itens = within(lista).getAllByRole('listitem');
    expect(itens).toHaveLength(2);
    expect(itens[0]).toHaveTextContent('Não lida: Ana Souza confirmou a sua aula de Matemática');
    expect(itens[0]).toHaveTextContent('10/11 às 9h30');
    expect(within(itens[0]).getByRole('link', { name: 'Ver aula' })).toHaveAttribute(
      'href',
      '/minhas-aulas?aba=proximas',
    );
    expect(itens[1]).not.toHaveTextContent('Não lida');
    expect(within(itens[1]).getByRole('link', { name: 'Ver aula' })).toHaveAttribute(
      'href',
      '/minhas-aulas?aba=historico',
    );
    expect(within(itens[1]).queryByRole('button', { name: 'Marcar como lida' })).not.toBeInTheDocument();
  });

  it('mostra quantos avisos estão sem ler na aba "Não lidas"', async () => {
    abrir();
    expect(await screen.findByRole('tab', { name: /Não lidas\s*1 não lidas/ })).toBeInTheDocument();
  });

  it('marca um aviso como lido', async () => {
    abrir();
    await userEvent.click(await screen.findByRole('button', { name: 'Marcar como lida' }));
    expect(marcarMock).toHaveBeenCalledWith(['n1']);
  });

  it('abrir a aula também marca o aviso como lido', async () => {
    abrir();
    const [primeiro] = await screen.findAllByRole('link', { name: 'Ver aula' });
    await userEvent.click(primeiro);
    expect(marcarMock).toHaveBeenCalledWith(['n1']);
  });

  it('marca todos os avisos como lidos de uma vez', async () => {
    abrir();
    await userEvent.click(await screen.findByRole('button', { name: 'Marcar todas como lidas' }));
    expect(marcarMock).toHaveBeenCalledTimes(1);
    expect(marcarMock).toHaveBeenCalledWith(undefined);
  });

  it('a aba "Não lidas" pede só os avisos sem ler', async () => {
    abrir('/notificacoes?aba=nao-lidas');

    expect(await screen.findByText(/Ana Souza confirmou/)).toBeInTheDocument();
    expect(screen.queryByText(/Ana Souza recusou/)).not.toBeInTheDocument();
    expect(listarMock).toHaveBeenCalledWith(expect.objectContaining({ apenasNaoLidas: true, pagina: 1 }));
  });

  it('sem avisos, explica quando eles aparecem e esconde "Marcar todas"', async () => {
    responderCom([]);
    abrir();

    expect(await screen.findByText(/Nenhum aviso ainda/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Marcar todas como lidas' })).not.toBeInTheDocument();
  });

  it('administrador não recebe avisos de aulas', async () => {
    vi.mocked(obterUsuarioAtual).mockResolvedValue({ ...CAIO, perfil: 'ADMIN' });
    abrir();

    expect(await screen.findByText('Contas de administrador não recebem avisos de aulas.')).toBeInTheDocument();
    expect(listarMock).not.toHaveBeenCalled();
  });
});
