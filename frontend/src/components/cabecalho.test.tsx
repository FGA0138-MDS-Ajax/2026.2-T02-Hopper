import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { removerToken, salvarToken } from '../services/api';
import { obterUsuarioAtual, type Usuario } from '../services/auth';
import { listarNotificacoes } from '../services/notificacoes';
import { renderizar } from '../test/renderizar';
import { Cabecalho } from './cabecalho';

vi.mock('../services/auth', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../services/auth')>()),
  obterUsuarioAtual: vi.fn(),
}));

const CAIO: Usuario = { id: 'u1', nome: 'Caio Alves', email: 'caio@email.com', telefone: null, perfil: 'ALUNO' };

describe('Cabecalho', () => {
  afterEach(() => removerToken());

  it('abre e fecha o menu do celular', async () => {
    renderizar(<Cabecalho />);
    const botao = screen.getByRole('button', { name: 'Abrir menu' });
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById('menu-movel')).not.toBeInTheDocument();

    await userEvent.click(botao);
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById('menu-movel')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Fechar menu' }));
    expect(document.getElementById('menu-movel')).not.toBeInTheDocument();
  });

  it('leva para entrar e criar conta', () => {
    renderizar(<Cabecalho />);
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/entrar');
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/cadastro');
  });

  it('visitante não vê o sino de notificações', () => {
    renderizar(<Cabecalho />);
    expect(screen.queryByRole('link', { name: /Notificações/ })).not.toBeInTheDocument();
    expect(listarNotificacoes).not.toHaveBeenCalled();
  });

  it('logado, mostra o sino com os avisos não lidos e o link para o perfil', async () => {
    salvarToken('token-do-caio');
    vi.mocked(obterUsuarioAtual).mockResolvedValue(CAIO);
    vi.mocked(listarNotificacoes).mockResolvedValue({ itens: [], total: 3, pagina: 1, naoLidas: 3 });
    renderizar(<Cabecalho />);

    // Um sino no cabeçalho do computador e outro ao lado do menu do celular.
    const sinos = await screen.findAllByRole('link', { name: 'Notificações, 3 não lidas' });
    expect(sinos).toHaveLength(2);
    sinos.forEach((sino) => expect(sino).toHaveAttribute('href', '/notificacoes'));
    expect(listarNotificacoes).toHaveBeenCalledWith({ apenasNaoLidas: true, limite: 1 });
    expect(screen.getByRole('link', { name: /Olá, Caio/ })).toHaveAttribute('href', '/meu-perfil');
  });

  it('administrador não vê o sino', async () => {
    salvarToken('token-do-admin');
    vi.mocked(obterUsuarioAtual).mockResolvedValue({ ...CAIO, perfil: 'ADMIN' });
    renderizar(<Cabecalho />);

    expect(await screen.findByRole('link', { name: /Olá, Caio/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Notificações/ })).not.toBeInTheDocument();
  });
});
