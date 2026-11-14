import type { Mocked } from 'vitest';
import { capturarErro } from '../../../tests/helpers/erros';
import {
  ErroConflito,
  ErroNaoAutenticado,
  ErroProibido,
  ErroRegraNegocio,
} from '../../shared/errors';
import { criarSeguranca, verificarToken } from '../../shared/utils/seguranca';
import type { AuthRepositorio, UsuarioComCredenciais } from './auth.repository';
import { AuthService } from './auth.service';

const SEGREDO = 'segredo-de-teste-com-mais-de-trinta-e-dois-caracteres';
const AGORA = new Date('2026-11-06T13:00:00.000Z');
const seguranca = criarSeguranca({ segredoJwt: SEGREDO, expiracaoJwt: '2h' });

const entrada = {
  nome: 'Maria',
  email: 'maria@exemplo.com',
  senha: 'Senha@123',
  perfil: 'ALUNO' as const,
  consentimentoLgpd: true,
};

function criarRepositorio(): Mocked<AuthRepositorio> {
  return {
    buscarPorEmail: vi.fn(),
    buscarPorId: vi.fn(),
    criarUsuario: vi.fn(),
    substituirTokenRecuperacao: vi.fn(),
    buscarTokenPorHash: vi.fn(),
    redefinirSenha: vi.fn(),
  };
}

async function criarUsuarioComSenha(
  senha: string,
  mudancas: Partial<UsuarioComCredenciais> = {},
): Promise<UsuarioComCredenciais> {
  return {
    id: 'u1',
    nome: 'Maria',
    email: 'maria@exemplo.com',
    telefone: null,
    perfil: 'ALUNO',
    ativo: true,
    senhaHash: await seguranca.gerarHashSenha(senha),
    ...mudancas,
  };
}

function criarServico(repositorio: Mocked<AuthRepositorio>) {
  const enviarEmailRecuperacao = vi.fn().mockResolvedValue(undefined);
  const servico = new AuthService({
    repositorio,
    seguranca,
    enviarEmailRecuperacao,
    frontendUrl: 'http://localhost:5173/',
    agora: () => AGORA,
  });
  return { servico, enviarEmailRecuperacao };
}

describe('AuthService', () => {
  describe('cadastrar', () => {
    it('grava somente o hash da senha e nao devolve dados sensiveis (CT13)', async () => {
      const repositorio = criarRepositorio();
      repositorio.buscarPorEmail.mockResolvedValue(null);
      repositorio.criarUsuario.mockImplementation(async (dados) => ({
        id: 'u1',
        ativo: true,
        ...dados,
      }));
      const { servico } = criarServico(repositorio);

      const usuario = await servico.cadastrar(entrada);

      const gravado = repositorio.criarUsuario.mock.calls[0][0];
      expect(gravado.senhaHash).not.toBe('Senha@123');
      expect(gravado.senhaHash.startsWith('$2')).toBe(true);
      expect(gravado.consentimentoLgpdEm).toEqual(AGORA);
      expect(gravado.telefone).toBeNull();
      expect(JSON.stringify(usuario)).not.toContain('senhaHash');
      expect(usuario).toEqual({
        id: 'u1',
        nome: 'Maria',
        email: 'maria@exemplo.com',
        telefone: null,
        perfil: 'ALUNO',
      });
    });

    it('repassa o perfil de professor e o telefone informado', async () => {
      const repositorio = criarRepositorio();
      repositorio.buscarPorEmail.mockResolvedValue(null);
      repositorio.criarUsuario.mockImplementation(async (dados) => ({
        id: 'u2',
        ativo: true,
        ...dados,
      }));
      const { servico } = criarServico(repositorio);

      await servico.cadastrar({ ...entrada, perfil: 'PROFESSOR', telefone: '61999998888' });

      const gravado = repositorio.criarUsuario.mock.calls[0][0];
      expect(gravado.perfil).toBe('PROFESSOR');
      expect(gravado.telefone).toBe('61999998888');
    });

    it('rejeita e-mail ja cadastrado com 409', async () => {
      const repositorio = criarRepositorio();
      repositorio.buscarPorEmail.mockResolvedValue(await criarUsuarioComSenha('qualquer'));
      const { servico } = criarServico(repositorio);

      await expect(servico.cadastrar(entrada)).rejects.toBeInstanceOf(ErroConflito);
      expect(repositorio.criarUsuario).not.toHaveBeenCalled();
    });
  });

  describe('autenticar', () => {
    it('devolve token valido e usuario sem o hash da senha', async () => {
      const repositorio = criarRepositorio();
      repositorio.buscarPorEmail.mockResolvedValue(await criarUsuarioComSenha('Senha@123'));
      const { servico } = criarServico(repositorio);

      const resultado = await servico.autenticar({
        email: 'maria@exemplo.com',
        senha: 'Senha@123',
      });

      expect(verificarToken(resultado.token, SEGREDO)).toEqual({ id: 'u1', perfil: 'ALUNO' });
      expect(JSON.stringify(resultado)).not.toContain('senhaHash');
    });

    it('usa a mesma resposta generica para senha errada e e-mail inexistente (CT02)', async () => {
      const repositorio = criarRepositorio();
      repositorio.buscarPorEmail.mockResolvedValueOnce(await criarUsuarioComSenha('Senha@123'));
      repositorio.buscarPorEmail.mockResolvedValueOnce(null);
      const { servico } = criarServico(repositorio);

      const senhaErrada = await capturarErro(
        servico.autenticar({ email: 'maria@exemplo.com', senha: 'errada' }),
      );
      const inexistente = await capturarErro(
        servico.autenticar({ email: 'x@exemplo.com', senha: 'qualquer' }),
      );

      expect(senhaErrada).toBeInstanceOf(ErroNaoAutenticado);
      expect(inexistente.status).toBe(senhaErrada.status);
      expect(inexistente.codigo).toBe(senhaErrada.codigo);
      expect(inexistente.message).toBe(senhaErrada.message);
    });

    it('bloqueia usuario inativo com 403', async () => {
      const repositorio = criarRepositorio();
      repositorio.buscarPorEmail.mockResolvedValue(
        await criarUsuarioComSenha('Senha@123', { ativo: false }),
      );
      const { servico } = criarServico(repositorio);

      await expect(
        servico.autenticar({ email: 'maria@exemplo.com', senha: 'Senha@123' }),
      ).rejects.toBeInstanceOf(ErroProibido);
    });
  });

  describe('obterUsuarioAtual', () => {
    it('devolve o usuario ativo', async () => {
      const repositorio = criarRepositorio();
      repositorio.buscarPorId.mockResolvedValue(await criarUsuarioComSenha('x'));
      const { servico } = criarServico(repositorio);
      expect((await servico.obterUsuarioAtual('u1')).email).toBe('maria@exemplo.com');
    });

    it('recusa usuario inexistente ou bloqueado', async () => {
      const repositorio = criarRepositorio();
      const { servico } = criarServico(repositorio);
      repositorio.buscarPorId.mockResolvedValueOnce(null);
      await expect(servico.obterUsuarioAtual('u1')).rejects.toBeInstanceOf(ErroNaoAutenticado);
      repositorio.buscarPorId.mockResolvedValueOnce(
        await criarUsuarioComSenha('x', { ativo: false }),
      );
      await expect(servico.obterUsuarioAtual('u1')).rejects.toBeInstanceOf(ErroProibido);
    });
  });

  describe('solicitarRecuperacao', () => {
    it('nao faz nada nem revela quando o e-mail nao existe', async () => {
      const repositorio = criarRepositorio();
      repositorio.buscarPorEmail.mockResolvedValue(null);
      const { servico, enviarEmailRecuperacao } = criarServico(repositorio);

      await expect(servico.solicitarRecuperacao('x@exemplo.com')).resolves.toBeUndefined();
      expect(enviarEmailRecuperacao).not.toHaveBeenCalled();
      expect(repositorio.substituirTokenRecuperacao).not.toHaveBeenCalled();
    });

    it('guarda so o hash do token e envia o link com o token puro', async () => {
      const repositorio = criarRepositorio();
      repositorio.buscarPorEmail.mockResolvedValue(await criarUsuarioComSenha('x'));
      const { servico, enviarEmailRecuperacao } = criarServico(repositorio);

      await servico.solicitarRecuperacao('maria@exemplo.com');

      const [destino, link] = enviarEmailRecuperacao.mock.calls[0];
      const token = new URL(link).searchParams.get('token') as string;
      const [usuarioId, tokenHash, expiraEm] = repositorio.substituirTokenRecuperacao.mock.calls[0];
      expect(destino).toBe('maria@exemplo.com');
      expect(link.startsWith('http://localhost:5173/redefinir-senha?token=')).toBe(true);
      expect(usuarioId).toBe('u1');
      expect(tokenHash).toBe(seguranca.gerarHashToken(token));
      expect(tokenHash).not.toBe(token);
      expect(expiraEm).toEqual(new Date(AGORA.getTime() + 60 * 60 * 1000));
    });

    it('nao propaga falha no envio do e-mail', async () => {
      const silenciar = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const repositorio = criarRepositorio();
      repositorio.buscarPorEmail.mockResolvedValue(await criarUsuarioComSenha('x'));
      const { servico, enviarEmailRecuperacao } = criarServico(repositorio);
      enviarEmailRecuperacao.mockRejectedValue(new Error('smtp fora'));

      await expect(servico.solicitarRecuperacao('maria@exemplo.com')).resolves.toBeUndefined();
      silenciar.mockRestore();
    });
  });

  describe('redefinirSenha', () => {
    const entradaRedefinir = { token: 'token-puro', novaSenha: 'NovaSenha@1' };

    it('grava o novo hash e consome o token', async () => {
      const repositorio = criarRepositorio();
      repositorio.buscarTokenPorHash.mockResolvedValue({
        id: 't1',
        usuarioId: 'u1',
        expiraEm: new Date(AGORA.getTime() + 1000),
        usadoEm: null,
      });
      repositorio.redefinirSenha.mockResolvedValue(true);
      const { servico } = criarServico(repositorio);

      await servico.redefinirSenha(entradaRedefinir);

      expect(repositorio.buscarTokenPorHash).toHaveBeenCalledWith(
        seguranca.gerarHashToken('token-puro'),
      );
      const [usuarioId, tokenId, senhaHash] = repositorio.redefinirSenha.mock.calls[0];
      expect([usuarioId, tokenId]).toEqual(['u1', 't1']);
      expect(senhaHash.startsWith('$2')).toBe(true);
    });

    it('recusa token inexistente, expirado ou ja usado', async () => {
      const repositorio = criarRepositorio();
      const { servico } = criarServico(repositorio);
      const base = { id: 't1', usuarioId: 'u1' };

      repositorio.buscarTokenPorHash.mockResolvedValueOnce(null);
      repositorio.buscarTokenPorHash.mockResolvedValueOnce({
        ...base,
        expiraEm: new Date(AGORA.getTime() - 1),
        usadoEm: null,
      });
      repositorio.buscarTokenPorHash.mockResolvedValueOnce({
        ...base,
        expiraEm: new Date(AGORA.getTime() + 1000),
        usadoEm: AGORA,
      });

      for (let i = 0; i < 3; i += 1) {
        await expect(servico.redefinirSenha(entradaRedefinir)).rejects.toBeInstanceOf(
          ErroRegraNegocio,
        );
      }
      expect(repositorio.redefinirSenha).not.toHaveBeenCalled();
    });

    it('recusa quando outro pedido consumiu o token primeiro', async () => {
      const repositorio = criarRepositorio();
      repositorio.buscarTokenPorHash.mockResolvedValue({
        id: 't1',
        usuarioId: 'u1',
        expiraEm: new Date(AGORA.getTime() + 1000),
        usadoEm: null,
      });
      repositorio.redefinirSenha.mockResolvedValue(false);
      const { servico } = criarServico(repositorio);

      await expect(servico.redefinirSenha(entradaRedefinir)).rejects.toBeInstanceOf(
        ErroRegraNegocio,
      );
    });
  });
});
