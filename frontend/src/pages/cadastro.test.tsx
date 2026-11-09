import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { removerToken } from '../services/api';
import { cadastrar, entrar, type Usuario } from '../services/auth';
import { renderizar } from '../test/renderizar';
import { PaginaCadastro } from './cadastro';

vi.mock('../services/auth', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../services/auth')>()),
  cadastrar: vi.fn(),
  entrar: vi.fn(),
  obterUsuarioAtual: vi.fn(),
}));

const cadastrarMock = vi.mocked(cadastrar);
const entrarMock = vi.mocked(entrar);

const NOVA: Usuario = { id: 'u9', nome: 'Rita Lopes', email: 'rita@email.com', telefone: '61988887777', perfil: 'PROFESSOR' };

function erroApi(status: number, corpo: object): AxiosError {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
  return new AxiosError('falha', 'ERR', config, undefined, { status, statusText: '', headers: {}, config, data: corpo });
}

function abrir(url = '/cadastro') {
  return renderizar(<PaginaCadastro />, { url, caminho: '/cadastro' });
}

async function preencherValido({ telefone = '(61) 98888-7777' } = {}) {
  await userEvent.type(screen.getByLabelText('Nome completo'), 'Rita Lopes');
  await userEvent.type(screen.getByLabelText('E-mail'), 'rita@email.com');
  if (telefone) await userEvent.type(screen.getByLabelText('Telefone (opcional)'), telefone);
  await userEvent.type(screen.getByLabelText('Senha'), 'segura123');
  await userEvent.click(screen.getByRole('checkbox'));
}

describe('PaginaCadastro', () => {
  afterEach(() => removerToken());

  it('começa como aluno e marca professor quando vem de "Quero dar aulas"', () => {
    abrir();
    expect(screen.getByRole('radio', { name: /Quero aprender/ })).toBeChecked();
  });

  it('marca o perfil professor pelo link', () => {
    abrir('/cadastro?perfil=PROFESSOR');
    expect(screen.getByRole('radio', { name: /Quero dar aulas/ })).toBeChecked();
  });

  it('valida senha, telefone e consentimento antes de enviar', async () => {
    abrir();
    await userEvent.type(screen.getByLabelText('Nome completo'), 'Rita Lopes');
    await userEvent.type(screen.getByLabelText('E-mail'), 'rita@email.com');
    await userEvent.type(screen.getByLabelText('Telefone (opcional)'), '1234');
    await userEvent.type(screen.getByLabelText('Senha'), 'somenteletras');
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText('Use letras e números na senha.')).toBeInTheDocument();
    expect(screen.getByText('Informe o DDD e o número (10 ou 11 dígitos).')).toBeInTheDocument();
    expect(screen.getByText('Para criar a conta, aceite a Política de privacidade.')).toBeInTheDocument();
    expect(cadastrarMock).not.toHaveBeenCalled();
  });

  it('cria a conta, entra e segue para o destino', async () => {
    cadastrarMock.mockResolvedValue(NOVA);
    entrarMock.mockResolvedValue({ token: 't', usuario: NOVA });
    abrir('/cadastro?perfil=PROFESSOR&voltar=%2Fprofessores');

    await preencherValido();
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(cadastrarMock).toHaveBeenCalledWith({
      perfil: 'PROFESSOR',
      nome: 'Rita Lopes',
      email: 'rita@email.com',
      telefone: '61988887777',
      senha: 'segura123',
      consentimentoLgpd: true,
    });
    expect(entrarMock).toHaveBeenCalledWith('rita@email.com', 'segura123');
    expect(await screen.findByTestId('local-atual')).toHaveTextContent(/^\/professores$/);
  });

  it('não envia telefone quando o campo fica vazio', async () => {
    cadastrarMock.mockResolvedValue(NOVA);
    entrarMock.mockResolvedValue({ token: 't', usuario: NOVA });
    abrir();

    await preencherValido({ telefone: '' });
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(cadastrarMock).toHaveBeenCalledWith(expect.objectContaining({ telefone: undefined, perfil: 'ALUNO' }));
  });

  it('avisa no campo quando o e-mail já tem conta', async () => {
    cadastrarMock.mockRejectedValue(
      erroApi(409, { erro: { codigo: 'EMAIL_JA_CADASTRADO', mensagem: 'E-mail já cadastrado', detalhes: null } }),
    );
    abrir();

    await preencherValido();
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText('Este e-mail já tem uma conta. Entre ou use outro e-mail.')).toBeInTheDocument();
    expect(entrarMock).not.toHaveBeenCalled();
  });

  it('mostra no campo certo os erros de validação da API', async () => {
    cadastrarMock.mockRejectedValue(
      erroApi(400, {
        erro: {
          codigo: 'VALIDACAO',
          mensagem: 'Dados inválidos',
          detalhes: [{ campo: 'body.nome', mensagem: 'Nome recusado pela API' }],
        },
      }),
    );
    abrir();

    await preencherValido();
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText('Nome recusado pela API')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome completo')).toHaveAttribute('aria-invalid', 'true');
  });

  it('a política de privacidade abre em outra aba para não perder o formulário', () => {
    abrir();
    const noFormulario = screen
      .getAllByRole('link', { name: 'Política de privacidade' })
      .find((link) => link.closest('form'));
    expect(noFormulario).toHaveAttribute('target', '_blank');
  });
});
