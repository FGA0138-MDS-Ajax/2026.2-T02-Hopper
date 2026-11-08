import bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { ErroNaoAutenticado } from '../errors';
import type { Perfil, UsuarioAutenticado } from '../types/dominio';

const CUSTO_BCRYPT = 10;
const PERFIS_VALIDOS: Perfil[] = ['ALUNO', 'PROFESSOR', 'ADMIN'];

export interface ConfiguracaoSeguranca {
  segredoJwt: string;
  expiracaoJwt: string;
}

export interface Seguranca {
  gerarHashSenha(senha: string): Promise<string>;
  compararSenha(senha: string, hash: string): Promise<boolean>;
  assinarToken(usuario: UsuarioAutenticado): string;
  gerarTokenAleatorio(): string;
  gerarHashToken(token: string): string;
}

export function criarSeguranca(configuracao: ConfiguracaoSeguranca): Seguranca {
  return {
    gerarHashSenha: (senha) => bcrypt.hash(senha, CUSTO_BCRYPT),
    compararSenha: (senha, hash) => bcrypt.compare(senha, hash),
    assinarToken: (usuario) =>
      jwt.sign({ perfil: usuario.perfil }, configuracao.segredoJwt, {
        subject: usuario.id,
        expiresIn: configuracao.expiracaoJwt as SignOptions['expiresIn'],
      }),
    gerarTokenAleatorio: () => randomBytes(32).toString('hex'),
    gerarHashToken: (token) => createHash('sha256').update(token).digest('hex'),
  };
}

export function verificarToken(token: string, segredo: string): UsuarioAutenticado {
  try {
    const carga = jwt.verify(token, segredo);
    if (typeof carga === 'string' || !carga.sub) throw new Error('carga inválida');
    const perfil = carga.perfil as Perfil;
    if (!PERFIS_VALIDOS.includes(perfil)) throw new Error('perfil inválido');
    return { id: carga.sub, perfil };
  } catch {
    throw new ErroNaoAutenticado('Token inválido ou expirado', 'TOKEN_INVALIDO');
  }
}
