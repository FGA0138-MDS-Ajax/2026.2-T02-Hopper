import { z } from 'zod';
import './zod-ptbr';

function mensagemDe(esquema: z.ZodTypeAny, valor: unknown): string {
  const resultado = esquema.safeParse(valor);
  if (resultado.success) throw new Error('esperava falha de validacao');
  return resultado.error.issues[0].message;
}

describe('zod-ptbr', () => {
  it('traduz campo obrigatorio e tipo invalido', () => {
    expect(mensagemDe(z.string(), undefined)).toBe('Campo obrigatório');
    expect(mensagemDe(z.string(), 10)).toBe('Tipo inválido: esperado string');
  });

  it('traduz limites de texto, lista e numero', () => {
    expect(mensagemDe(z.string().min(3), 'a')).toBe('Deve ter no mínimo 3 caracteres');
    expect(mensagemDe(z.string().max(2), 'abc')).toBe('Deve ter no máximo 2 caracteres');
    expect(mensagemDe(z.array(z.string()).min(1), [])).toBe('Deve ter no mínimo 1 itens');
    expect(mensagemDe(z.array(z.string()).max(1), ['a', 'b'])).toBe('Deve ter no máximo 1 itens');
    expect(mensagemDe(z.number().min(5), 1)).toBe('Deve ser maior ou igual a 5');
    expect(mensagemDe(z.number().max(5), 9)).toBe('Deve ser menor ou igual a 5');
  });

  it('traduz formatos de string', () => {
    expect(mensagemDe(z.string().email(), 'x')).toBe('E-mail inválido');
    expect(mensagemDe(z.string().uuid(), 'x')).toBe('Identificador inválido');
    expect(mensagemDe(z.string().datetime(), 'x')).toBe(
      'Data e hora inválidas (use o formato ISO 8601)',
    );
    expect(mensagemDe(z.string().regex(/^a$/), 'b')).toBe('Formato inválido');
  });

  it('traduz enumeracoes e literais', () => {
    expect(mensagemDe(z.enum(['A', 'B']), 'C')).toBe('Valor inválido. Opções: A, B');
    expect(mensagemDe(z.literal(true), false)).toBe('Valor inválido');
  });
});
