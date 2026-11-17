import { prisma } from '../../infra/prisma';
import { ErroConflito } from '../../shared/errors';
import type { Perfil } from '../../shared/types/dominio';
import { ehViolacaoDeUnicidade } from '../../shared/utils/erros-banco';

export interface UsuarioComCredenciais {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  perfil: Perfil;
  ativo: boolean;
  senhaHash: string;
}

export interface NovoUsuario {
  nome: string;
  email: string;
  senhaHash: string;
  telefone: string | null;
  perfil: 'ALUNO' | 'PROFESSOR';
  consentimentoLgpdEm: Date;
}

export interface TokenRecuperacao {
  id: string;
  usuarioId: string;
  expiraEm: Date;
  usadoEm: Date | null;
}

export interface AuthRepositorio {
  buscarPorEmail(email: string): Promise<UsuarioComCredenciais | null>;
  buscarPorId(id: string): Promise<UsuarioComCredenciais | null>;
  criarUsuario(dados: NovoUsuario): Promise<UsuarioComCredenciais>;
  substituirTokenRecuperacao(
    usuarioId: string,
    tokenHash: string,
    expiraEm: Date,
    agora: Date,
  ): Promise<void>;
  buscarTokenPorHash(tokenHash: string): Promise<TokenRecuperacao | null>;
  redefinirSenha(
    usuarioId: string,
    tokenId: string,
    senhaHash: string,
    agora: Date,
  ): Promise<boolean>;
}

const selecaoUsuario = {
  id: true,
  nome: true,
  email: true,
  telefone: true,
  perfil: true,
  ativo: true,
  senhaHash: true,
} as const;

export class AuthRepositorioPrisma implements AuthRepositorio {
  buscarPorEmail(email: string): Promise<UsuarioComCredenciais | null> {
    return prisma.usuario.findUnique({ where: { email }, select: selecaoUsuario });
  }

  buscarPorId(id: string): Promise<UsuarioComCredenciais | null> {
    return prisma.usuario.findUnique({ where: { id }, select: selecaoUsuario });
  }

  async criarUsuario(dados: NovoUsuario): Promise<UsuarioComCredenciais> {
    try {
      return await prisma.usuario.create({
        data: {
          nome: dados.nome,
          email: dados.email,
          senhaHash: dados.senhaHash,
          telefone: dados.telefone,
          perfil: dados.perfil,
          consentimentoLgpdEm: dados.consentimentoLgpdEm,
          perfilProfessor: dados.perfil === 'PROFESSOR' ? { create: {} } : undefined,
        },
        select: selecaoUsuario,
      });
    } catch (erro) {
      if (ehViolacaoDeUnicidade(erro)) {
        throw new ErroConflito('E-mail já cadastrado', 'EMAIL_JA_CADASTRADO');
      }
      throw erro;
    }
  }

  async substituirTokenRecuperacao(
    usuarioId: string,
    tokenHash: string,
    expiraEm: Date,
    agora: Date,
  ): Promise<void> {
    await prisma.$transaction([
      prisma.tokenRecuperacaoSenha.deleteMany({
        where: { OR: [{ usuarioId }, { expiraEm: { lt: agora } }] },
      }),
      prisma.tokenRecuperacaoSenha.create({ data: { usuarioId, tokenHash, expiraEm } }),
    ]);
  }

  buscarTokenPorHash(tokenHash: string): Promise<TokenRecuperacao | null> {
    return prisma.tokenRecuperacaoSenha.findUnique({
      where: { tokenHash },
      select: { id: true, usuarioId: true, expiraEm: true, usadoEm: true },
    });
  }

  async redefinirSenha(
    usuarioId: string,
    tokenId: string,
    senhaHash: string,
    agora: Date,
  ): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      const marcado = await tx.tokenRecuperacaoSenha.updateMany({
        where: { id: tokenId, usadoEm: null },
        data: { usadoEm: agora },
      });
      if (marcado.count === 0) return false;
      await tx.usuario.update({ where: { id: usuarioId }, data: { senhaHash } });
      return true;
    });
  }
}
