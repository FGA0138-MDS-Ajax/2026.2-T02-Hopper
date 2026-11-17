import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { redefinirSenha, solicitarRecuperacaoDeSenha } from '../services/auth';
import { renderizar } from '../test/renderizar';
import { PaginaRecuperarSenha } from './recuperar-senha';
import { PaginaRedefinirSenha } from './redefinir-senha';

vi.mock('../services/auth', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../services/auth')>()),
  solicitarRecuperacaoDeSenha: vi.fn(),
  redefinirSenha: vi.fn(),
  obterUsuarioAtual: vi.fn(),
}));

const solicitarMock = vi.mocked(solicitarRecuperacaoDeSenha);
const redefinirMock = vi.mocked(redefinirSenha);

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

describe('PaginaRecuperarSenha', () => {
  it('pede o link e mostra a mesma confirmação exista ou não a conta', async () => {
    solicitarMock.mockResolvedValue();
    renderizar(<PaginaRecuperarSenha />, { url: '/recuperar-senha', caminho: '/recuperar-senha' });

    await userEvent.type(screen.getByLabelText('E-mail'), 'caio@email.com');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar link' }));

    expect(solicitarMock).toHaveBeenCalledWith('caio@email.com');
    expect(await screen.findByRole('heading', { name: 'Verifique seu e-mail' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Se houver uma conta com caio@email.com');
  });

  it('valida o e-mail antes de enviar', async () => {
    renderizar(<PaginaRecuperarSenha />, { url: '/recuperar-senha', caminho: '/recuperar-senha' });
    await userEvent.type(screen.getByLabelText('E-mail'), 'nao-e-email');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar link' }));

    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument();
    expect(solicitarMock).not.toHaveBeenCalled();
  });

  it('mostra o aviso de limite de tentativas da API', async () => {
    solicitarMock.mockRejectedValue(
      erroApi(429, 'MUITAS_TENTATIVAS', 'Muitas solicitações de recuperação de senha. Tente novamente mais tarde'),
    );
    renderizar(<PaginaRecuperarSenha />, { url: '/recuperar-senha', caminho: '/recuperar-senha' });

    await userEvent.type(screen.getByLabelText('E-mail'), 'caio@email.com');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar link' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Muitas solicitações');
  });
});

describe('PaginaRedefinirSenha', () => {
  function abrir(url: string) {
    return renderizar(<PaginaRedefinirSenha />, { url, caminho: '/redefinir-senha' });
  }

  it('sem token no link, explica e oferece um novo link', () => {
    abrir('/redefinir-senha');
    expect(screen.getByRole('heading', { name: 'Link inválido ou expirado' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pedir um novo link' })).toHaveAttribute('href', '/recuperar-senha');
  });

  it('exige senha forte e as duas senhas iguais', async () => {
    abrir('/redefinir-senha?token=abc');
    await userEvent.type(screen.getByLabelText('Nova senha'), 'nova12345');
    await userEvent.type(screen.getByLabelText('Repita a nova senha'), 'outra12345');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }));

    expect(await screen.findByText('As senhas não são iguais.')).toBeInTheDocument();
    expect(redefinirMock).not.toHaveBeenCalled();
  });

  it('salva a nova senha e leva para o login com a confirmação', async () => {
    redefinirMock.mockResolvedValue();
    abrir('/redefinir-senha?token=abc');
    await userEvent.type(screen.getByLabelText('Nova senha'), 'nova12345');
    await userEvent.type(screen.getByLabelText('Repita a nova senha'), 'nova12345');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }));

    expect(redefinirMock).toHaveBeenCalledWith('abc', 'nova12345');
    expect(await screen.findByTestId('local-atual')).toHaveTextContent('/entrar?senha=redefinida');
  });

  it('token recusado pela API mostra a tela de link expirado', async () => {
    redefinirMock.mockRejectedValue(erroApi(400, 'TOKEN_INVALIDO', 'Token inválido ou expirado'));
    abrir('/redefinir-senha?token=velho');
    await userEvent.type(screen.getByLabelText('Nova senha'), 'nova12345');
    await userEvent.type(screen.getByLabelText('Repita a nova senha'), 'nova12345');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }));

    expect(await screen.findByRole('heading', { name: 'Link inválido ou expirado' })).toBeInTheDocument();
  });
});
