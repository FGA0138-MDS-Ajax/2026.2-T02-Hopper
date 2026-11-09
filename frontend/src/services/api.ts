import axios, { AxiosError } from 'axios';

const CHAVE_TOKEN = 'aulacerta.token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api/v1',
  timeout: 15000,
});

export function lerToken(): string | null {
  try {
    return localStorage.getItem(CHAVE_TOKEN);
  } catch {
    return null;
  }
}

export function salvarToken(token: string): void {
  try {
    localStorage.setItem(CHAVE_TOKEN, token);
  } catch {
    // Armazenamento indisponível (aba anônima, por exemplo): segue sem persistir.
  }
}

export function removerToken(): void {
  try {
    localStorage.removeItem(CHAVE_TOKEN);
  } catch {
    // Nada a fazer.
  }
}

api.interceptors.request.use((config) => {
  const token = lerToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Resposta 401 com token salvo = sessão expirada: volta para o login.
api.interceptors.response.use(
  (resposta) => resposta,
  (erro: AxiosError) => {
    if (erro.response?.status === 401 && lerToken()) {
      removerToken();
      window.location.assign('/entrar');
    }
    return Promise.reject(erro);
  },
);

interface CorpoDeErro {
  erro?: { codigo?: string; mensagem?: string };
}

/** Extrai a mensagem do formato padrão { erro: { codigo, mensagem, detalhes } }. */
export function mensagemDeErro(erro: unknown, padrao = 'Algo deu errado. Tente novamente.'): string {
  if (erro instanceof AxiosError) {
    if (!erro.response) return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
    const corpo = erro.response.data as CorpoDeErro | undefined;
    return corpo?.erro?.mensagem ?? padrao;
  }
  return padrao;
}
