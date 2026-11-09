import { AxiosError } from 'axios';
import { api } from './api';

export type PerfilUsuario = 'ALUNO' | 'PROFESSOR' | 'ADMIN';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  perfil: PerfilUsuario;
}

export interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  perfil: 'ALUNO' | 'PROFESSOR';
  consentimentoLgpd: boolean;
}

export async function entrar(email: string, senha: string): Promise<{ token: string; usuario: Usuario }> {
  const { data } = await api.post<{ token: string; usuario: Usuario }>('/auth/login', { email, senha });
  return data;
}

export async function cadastrar(dados: DadosCadastro): Promise<Usuario> {
  const { data } = await api.post<Usuario>('/auth/cadastro', dados);
  return data;
}

/** Pede o e-mail de redefinição. A API responde igual exista ou não a conta (não revela quem é cadastrado). */
export async function solicitarRecuperacaoDeSenha(email: string): Promise<void> {
  await api.post('/auth/recuperar-senha', { email });
}

export async function redefinirSenha(token: string, novaSenha: string): Promise<void> {
  await api.post('/auth/redefinir-senha', { token, novaSenha });
}

export async function obterUsuarioAtual(): Promise<Usuario> {
  const { data } = await api.get<Usuario>('/auth/me');
  return data;
}

interface CorpoDeErro {
  erro?: { codigo?: string; detalhes?: { campo: string; mensagem: string }[] | null };
}

/** Código de erro do formato padrão da API (ex.: "EMAIL_JA_CADASTRADO"). */
export function codigoDeErro(erro: unknown): string | undefined {
  if (!(erro instanceof AxiosError)) return undefined;
  return (erro.response?.data as CorpoDeErro | undefined)?.erro?.codigo;
}

/** Erros de validação da API por campo do formulário ("body.email" vira "email"); fica a primeira mensagem de cada campo. */
export function errosPorCampo(erro: unknown): Record<string, string> {
  if (!(erro instanceof AxiosError)) return {};
  const detalhes = (erro.response?.data as CorpoDeErro | undefined)?.erro?.detalhes ?? [];
  const resultado: Record<string, string> = {};
  for (const detalhe of detalhes) {
    const campo = detalhe.campo.replace(/^body\./, '');
    resultado[campo] ??= detalhe.mensagem;
  }
  return resultado;
}
