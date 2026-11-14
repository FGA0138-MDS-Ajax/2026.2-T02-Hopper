import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import { simularApi } from '../test/api-simulada';
import {
  atualizarConta,
  cadastrar,
  codigoDeErro,
  entrar,
  errosPorCampo,
  obterUsuarioAtual,
  redefinirSenha,
  solicitarRecuperacaoDeSenha,
  type DadosCadastro,
} from './auth';

function erroDaApi(corpo: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
  return new AxiosError('falha', 'ERR', config, undefined, {
    status: 400,
    statusText: '',
    headers: {},
    config,
    data: corpo,
  });
}

describe('serviço de autenticação (rotas e corpo enviados à API)', () => {
  let api: ReturnType<typeof simularApi>;
  afterEach(() => api.restaurar());

  it('entrar envia e-mail e senha e devolve token e usuário (RF02)', async () => {
    const resposta = { token: 't', usuario: { id: 'u1' } };
    api = simularApi(resposta);

    await expect(entrar('ana@exemplo.com', 'Senha@123')).resolves.toEqual(resposta);
    expect(api.unica()).toMatchObject({
      metodo: 'POST',
      url: '/auth/login',
      corpo: { email: 'ana@exemplo.com', senha: 'Senha@123' },
    });
  });

  it('cadastrar envia os dados da conta (RF01)', async () => {
    api = simularApi({ id: 'u1' });
    const dados: DadosCadastro = {
      nome: 'Ana',
      email: 'ana@exemplo.com',
      senha: 'Senha@123',
      perfil: 'ALUNO',
      consentimentoLgpd: true,
    };

    await expect(cadastrar(dados)).resolves.toEqual({ id: 'u1' });
    expect(api.unica()).toMatchObject({ metodo: 'POST', url: '/auth/cadastro', corpo: dados });
  });

  it('pede a recuperação e redefine a senha (RF03)', async () => {
    api = simularApi({});

    await solicitarRecuperacaoDeSenha('ana@exemplo.com');
    await redefinirSenha('token-do-email', 'Nova@1234');

    expect(api.chamadas.map((c) => [c.metodo, c.url, c.corpo])).toEqual([
      ['POST', '/auth/recuperar-senha', { email: 'ana@exemplo.com' }],
      ['POST', '/auth/redefinir-senha', { token: 'token-do-email', novaSenha: 'Nova@1234' }],
    ]);
  });

  it('lê o usuário logado e atualiza nome e telefone da conta', async () => {
    const usuario = { id: 'u1', nome: 'Ana', telefone: null };
    api = simularApi(usuario);

    await expect(obterUsuarioAtual()).resolves.toEqual(usuario);
    await expect(atualizarConta({ nome: 'Ana', telefone: null })).resolves.toEqual(usuario);

    expect(api.chamadas.map((c) => [c.metodo, c.url, c.corpo])).toEqual([
      ['GET', '/auth/me', undefined],
      ['PUT', '/usuarios/me', { nome: 'Ana', telefone: null }],
    ]);
  });
});

describe('leitura dos erros da API', () => {
  it('codigoDeErro devolve o código do formato padrão', () => {
    expect(codigoDeErro(erroDaApi({ erro: { codigo: 'EMAIL_JA_CADASTRADO' } }))).toBe('EMAIL_JA_CADASTRADO');
    expect(codigoDeErro(erroDaApi(undefined))).toBeUndefined();
    expect(codigoDeErro(new Error('x'))).toBeUndefined();
  });

  it('errosPorCampo tira o prefixo "body." e guarda a primeira mensagem de cada campo', () => {
    const erro = erroDaApi({
      erro: {
        detalhes: [
          { campo: 'body.email', mensagem: 'E-mail inválido' },
          { campo: 'body.email', mensagem: 'Outra mensagem' },
          { campo: 'senha', mensagem: 'Senha fraca' },
        ],
      },
    });

    expect(errosPorCampo(erro)).toEqual({ email: 'E-mail inválido', senha: 'Senha fraca' });
  });

  it('errosPorCampo devolve vazio sem detalhes ou fora do axios', () => {
    expect(errosPorCampo(erroDaApi({ erro: { detalhes: null } }))).toEqual({});
    expect(errosPorCampo(new Error('x'))).toEqual({});
  });
});
