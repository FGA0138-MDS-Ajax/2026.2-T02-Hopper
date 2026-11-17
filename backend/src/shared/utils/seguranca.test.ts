import { ErroNaoAutenticado } from '../errors';
import { criarSeguranca, verificarToken } from './seguranca';

const SEGREDO = 'segredo-de-teste-com-mais-de-trinta-e-dois-caracteres';
const seguranca = criarSeguranca({ segredoJwt: SEGREDO, expiracaoJwt: '2h' });

describe('seguranca', () => {
  it('gera hash de senha que nao revela a senha e permite comparar', async () => {
    const hash = await seguranca.gerarHashSenha('Senha@123');
    expect(hash).not.toContain('Senha@123');
    expect(await seguranca.compararSenha('Senha@123', hash)).toBe(true);
    expect(await seguranca.compararSenha('outra', hash)).toBe(false);
  });

  it('assina e verifica token com id e perfil', () => {
    const token = seguranca.assinarToken({ id: 'u1', perfil: 'PROFESSOR' });
    expect(verificarToken(token, SEGREDO)).toEqual({ id: 'u1', perfil: 'PROFESSOR' });
  });

  it('rejeita token invalido ou assinado com outro segredo', () => {
    const token = seguranca.assinarToken({ id: 'u1', perfil: 'ALUNO' });
    expect(() => verificarToken('lixo', SEGREDO)).toThrow(ErroNaoAutenticado);
    expect(() => verificarToken(token, 'outro-segredo-com-mais-de-trinta-e-dois-chars')).toThrow(
      ErroNaoAutenticado,
    );
  });

  it('gera tokens aleatorios distintos e hash deterministico', () => {
    const a = seguranca.gerarTokenAleatorio();
    const b = seguranca.gerarTokenAleatorio();
    expect(a).not.toBe(b);
    expect(seguranca.gerarHashToken(a)).toBe(seguranca.gerarHashToken(a));
    expect(seguranca.gerarHashToken(a)).not.toBe(a);
  });
});
