import {
  ErroConflito,
  ErroNaoAutenticado,
  ErroProibido,
  ErroRegraNegocio,
} from '../../shared/errors';
import type { UsuarioPublico } from '../../shared/types/dominio';
import type { Seguranca } from '../../shared/utils/seguranca';
import type { AuthRepositorio, UsuarioComCredenciais } from './auth.repository';
import type { EntradaCadastro, EntradaLogin, EntradaRedefinirSenha } from './auth.schemas';

export interface ResultadoLogin {
  token: string;
  usuario: UsuarioPublico;
}

export interface DependenciasAuthService {
  repositorio: AuthRepositorio;
  seguranca: Seguranca;
  enviarEmailRecuperacao: (destino: string, link: string) => Promise<void>;
  frontendUrl: string;
  agora?: () => Date;
}

const VALIDADE_TOKEN_RECUPERACAO_MS = 60 * 60 * 1000;
const SENHA_FICTICIA = 'senha-ficticia-para-igualar-o-tempo-de-resposta';

function paraUsuarioPublico(usuario: UsuarioComCredenciais): UsuarioPublico {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    telefone: usuario.telefone,
    perfil: usuario.perfil,
  };
}

export class AuthService {
  private hashFicticio: Promise<string> | undefined;

  constructor(private readonly deps: DependenciasAuthService) {}

  async cadastrar(entrada: EntradaCadastro): Promise<UsuarioPublico> {
    const existente = await this.deps.repositorio.buscarPorEmail(entrada.email);
    if (existente) throw new ErroConflito('E-mail já cadastrado', 'EMAIL_JA_CADASTRADO');
    const senhaHash = await this.deps.seguranca.gerarHashSenha(entrada.senha);
    const criado = await this.deps.repositorio.criarUsuario({
      nome: entrada.nome,
      email: entrada.email,
      senhaHash,
      telefone: entrada.telefone ?? null,
      perfil: entrada.perfil,
      consentimentoLgpdEm: this.agora(),
    });
    return paraUsuarioPublico(criado);
  }

  async autenticar(entrada: EntradaLogin): Promise<ResultadoLogin> {
    const usuario = await this.deps.repositorio.buscarPorEmail(entrada.email);
    const hash = usuario ? usuario.senhaHash : await this.obterHashFicticio();
    const senhaCorreta = await this.deps.seguranca.compararSenha(entrada.senha, hash);
    if (!usuario || !senhaCorreta) {
      throw new ErroNaoAutenticado('E-mail ou senha inválidos', 'CREDENCIAIS_INVALIDAS');
    }
    if (!usuario.ativo) throw new ErroProibido('Conta bloqueada', 'CONTA_INATIVA');
    const token = this.deps.seguranca.assinarToken({ id: usuario.id, perfil: usuario.perfil });
    return { token, usuario: paraUsuarioPublico(usuario) };
  }

  async obterUsuarioAtual(usuarioId: string): Promise<UsuarioPublico> {
    const usuario = await this.deps.repositorio.buscarPorId(usuarioId);
    if (!usuario) throw new ErroNaoAutenticado('Usuário não encontrado', 'USUARIO_NAO_ENCONTRADO');
    if (!usuario.ativo) throw new ErroProibido('Conta bloqueada', 'CONTA_INATIVA');
    return paraUsuarioPublico(usuario);
  }

  async solicitarRecuperacao(email: string): Promise<void> {
    const usuario = await this.deps.repositorio.buscarPorEmail(email);
    if (!usuario || !usuario.ativo) return;
    const agora = this.agora();
    const token = this.deps.seguranca.gerarTokenAleatorio();
    await this.deps.repositorio.substituirTokenRecuperacao(
      usuario.id,
      this.deps.seguranca.gerarHashToken(token),
      new Date(agora.getTime() + VALIDADE_TOKEN_RECUPERACAO_MS),
      agora,
    );
    const base = this.deps.frontendUrl.replace(/\/+$/, '');
    try {
      await this.deps.enviarEmailRecuperacao(
        usuario.email,
        `${base}/redefinir-senha?token=${token}`,
      );
    } catch (erro) {
      console.error('Falha ao enviar o e-mail de recuperação de senha', erro);
    }
  }

  async redefinirSenha(entrada: EntradaRedefinirSenha): Promise<void> {
    const tokenHash = this.deps.seguranca.gerarHashToken(entrada.token);
    const registro = await this.deps.repositorio.buscarTokenPorHash(tokenHash);
    const agora = this.agora();
    if (!registro || registro.usadoEm !== null || registro.expiraEm.getTime() <= agora.getTime()) {
      throw this.erroTokenInvalido();
    }
    const senhaHash = await this.deps.seguranca.gerarHashSenha(entrada.novaSenha);
    const aplicado = await this.deps.repositorio.redefinirSenha(
      registro.usuarioId,
      registro.id,
      senhaHash,
      agora,
    );
    if (!aplicado) throw this.erroTokenInvalido();
  }

  private erroTokenInvalido(): ErroRegraNegocio {
    return new ErroRegraNegocio('Token inválido ou expirado', 'TOKEN_INVALIDO');
  }

  private obterHashFicticio(): Promise<string> {
    this.hashFicticio ??= this.deps.seguranca.gerarHashSenha(SENHA_FICTICIA);
    return this.hashFicticio;
  }

  private agora(): Date {
    return this.deps.agora ? this.deps.agora() : new Date();
  }
}
