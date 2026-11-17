import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, lerToken, mensagemDeErro, removerToken, salvarToken } from './api';

function erroHttp(status: number, data?: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
  return new AxiosError('falha', 'ERR', config, undefined, {
    status,
    statusText: '',
    headers: {},
    config,
    data,
  });
}

describe('token da sessão', () => {
  afterEach(() => removerToken());

  it('salva, lê e remove o token', () => {
    expect(lerToken()).toBeNull();
    salvarToken('abc');
    expect(lerToken()).toBe('abc');
    removerToken();
    expect(lerToken()).toBeNull();
  });
});

describe('mensagemDeErro', () => {
  it('usa a mensagem do formato padrão da API', () => {
    const erro = erroHttp(409, { erro: { codigo: 'CONFLITO', mensagem: 'Horário indisponível' } });
    expect(mensagemDeErro(erro)).toBe('Horário indisponível');
  });

  it('usa a mensagem padrão quando a API não manda mensagem', () => {
    expect(mensagemDeErro(erroHttp(500), 'Falhou')).toBe('Falhou');
  });

  it('avisa sobre falta de conexão quando não há resposta', () => {
    const erro = new AxiosError('Network Error', 'ERR_NETWORK');
    expect(mensagemDeErro(erro)).toMatch(/conectar ao servidor/);
  });

  it('usa a mensagem padrão para erros que não vieram do axios', () => {
    expect(mensagemDeErro(new Error('x'))).toBe('Algo deu errado. Tente novamente.');
  });
});

describe('interceptores do cliente HTTP', () => {
  const adaptadorOriginal = api.defaults.adapter;
  const assign = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('location', { ...window.location, assign });
  });

  afterEach(() => {
    api.defaults.adapter = adaptadorOriginal;
    removerToken();
    vi.unstubAllGlobals();
  });

  it('anexa o token no cabeçalho Authorization', async () => {
    salvarToken('meu-token');
    let cabecalho: unknown;
    api.defaults.adapter = async (config) => {
      cabecalho = config.headers.Authorization;
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
    };

    await api.get('/qualquer');
    expect(cabecalho).toBe('Bearer meu-token');
  });

  it('em 401 com sessão salva, remove o token e volta para o login', async () => {
    salvarToken('expirado');
    api.defaults.adapter = async () => {
      throw erroHttp(401);
    };

    await expect(api.get('/aulas')).rejects.toBeInstanceOf(AxiosError);
    expect(lerToken()).toBeNull();
    expect(assign).toHaveBeenCalledWith('/entrar');
  });

  it('em 401 sem sessão (ex.: login errado), não redireciona', async () => {
    api.defaults.adapter = async () => {
      throw erroHttp(401);
    };

    await expect(api.post('/auth/login')).rejects.toBeInstanceOf(AxiosError);
    expect(assign).not.toHaveBeenCalled();
  });
});
