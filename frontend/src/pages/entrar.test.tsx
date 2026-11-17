import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { lerToken, removerToken } from '../services/api';
import { entrar, type Usuario } from '../services/auth';
import { renderizar } from '../test/renderizar';
import { PaginaEntrar } from './entrar';

vi.mock('../services/auth', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../services/auth')>()),
  entrar: vi.fn(),
  obterUsuarioAtual: vi.fn(),
}));

const entrarMock = vi.mocked(entrar);

const CAIO: Usuario = {
  id: 'u1',
  nome: 'Caio Alves',
  email: 'caio.aluno@aulacerta.com.br',
  telefone: null,
  perfil: 'ALUNO',
};

function erroHttp(status: number, mensagem: string): AxiosError {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
  return new AxiosError('falha', 'ERR', config, undefined, {
    status,
    statusText: '',
    headers: {},
    config,
    data: { erro: { codigo: 'X', mensagem, detalhes: null } },
  });
}

function abrir(url = '/entrar') {
  return renderizar(<PaginaEntrar />, { url, caminho: '/entrar' });
}

async function preencher(email: string, senha: string) {
  await userEvent.type(screen.getByLabelText('E-mail'), email);
  await userEvent.type(screen.getByLabelText('Senha'), senha);
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
}

describe('PaginaEntrar', () => {
  afterEach(() => removerToken());

  it('valida os campos antes de chamar a API', async () => {
    abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Informe seu e-mail.')).toBeInTheDocument();
    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true');
    expect(entrarMock).not.toHaveBeenCalled();
  });

  it('entra, guarda a sessão e volta para onde a pessoa estava', async () => {
    entrarMock.mockResolvedValue({ token: 'token-do-caio', usuario: CAIO });
    abrir('/entrar?voltar=%2Fprofessores%2Fp1%2Fsolicitar%3Finicio%3Dx');

    await preencher('caio.aluno@aulacerta.com.br', 'Senha@12345');

    expect(entrarMock).toHaveBeenCalledWith('caio.aluno@aulacerta.com.br', 'Senha@12345');
    expect(await screen.findByTestId('local-atual')).toHaveTextContent('/professores/p1/solicitar?inicio=x');
    expect(lerToken()).toBe('token-do-caio');
  });

  it('ignora destinos externos no parâmetro "voltar"', async () => {
    entrarMock.mockResolvedValue({ token: 't', usuario: CAIO });
    abrir('/entrar?voltar=https%3A%2F%2Fsite-falso.com');

    await preencher('caio.aluno@aulacerta.com.br', 'Senha@12345');

    expect(await screen.findByTestId('local-atual')).toHaveTextContent(/^\/$/);
  });

  it('mostra a mensagem da API quando e-mail ou senha estão errados', async () => {
    entrarMock.mockRejectedValue(erroHttp(401, 'E-mail ou senha inválidos'));
    abrir();

    await preencher('caio.aluno@aulacerta.com.br', 'errada123');

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos');
    expect(lerToken()).toBeNull();
  });

  it('mostra e esconde a senha', async () => {
    abrir();
    const senha = screen.getByLabelText('Senha');
    expect(senha).toHaveAttribute('type', 'password');

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(senha).toHaveAttribute('type', 'text');
  });

  it('leva para criar conta mantendo o destino', () => {
    abrir('/entrar?voltar=%2Fprofessores%2Fp1');
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute(
      'href',
      '/cadastro?voltar=%2Fprofessores%2Fp1',
    );
  });

  it('explica por que pediu login quando vem de "Solicitar aula"', () => {
    abrir('/entrar?voltar=%2Fprofessores%2Fp1%2Fsolicitar');
    expect(screen.getByRole('status')).toHaveTextContent('Entre na sua conta para concluir a solicitação da aula.');
  });

  it('confirma a troca de senha quando volta da redefinição', () => {
    abrir('/entrar?senha=redefinida');
    expect(screen.getByRole('status')).toHaveTextContent('Senha alterada. Entre com a nova senha.');
  });

  it('tem o atalho para recuperar a senha', () => {
    abrir();
    expect(screen.getByRole('link', { name: 'Esqueci minha senha' })).toHaveAttribute('href', '/recuperar-senha');
  });

  it('avisa quando o Caps Lock está ativado na senha', async () => {
    abrir();
    const senha = screen.getByLabelText('Senha');
    await userEvent.type(senha, '{CapsLock}a');
    expect(screen.getByText('Caps Lock está ativado.')).toBeInTheDocument();
  });
});
