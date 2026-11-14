import { Prisma } from '@prisma/client';
import {
  ehConflitoEntreTransacoes,
  ehViolacaoDeExclusao,
  ehViolacaoDeUnicidade,
} from './erros-banco';

describe('erros-banco', () => {
  it('reconhece violacao de exclusao pelo codigo do driver e pela mensagem', () => {
    expect(ehViolacaoDeExclusao({ cause: { originalCode: '23P01' } })).toBe(true);
    expect(ehViolacaoDeExclusao({ cause: { code: '23P01' } })).toBe(true);
    expect(
      ehViolacaoDeExclusao(new Error('violates exclusion constraint aula_sem_sobreposicao')),
    ).toBe(true);
  });

  it('nao confunde outros erros com violacao de exclusao ou unicidade', () => {
    expect(ehViolacaoDeExclusao(new Error('falha qualquer'))).toBe(false);
    expect(ehViolacaoDeExclusao(null)).toBe(false);
    expect(ehViolacaoDeUnicidade(new Error('P2002'))).toBe(false);
  });

  it('reconhece conflito entre transacoes (deadlock ou falha de serializacao)', () => {
    const doPrisma = new Prisma.PrismaClientKnownRequestError(
      'Transaction failed due to a write conflict',
      {
        code: 'P2034',
        clientVersion: 'teste',
      },
    );
    expect(ehConflitoEntreTransacoes(doPrisma)).toBe(true);
    expect(ehConflitoEntreTransacoes({ cause: { kind: 'TransactionWriteConflict' } })).toBe(true);
    expect(ehConflitoEntreTransacoes({ cause: { originalCode: '40P01' } })).toBe(true);
    expect(ehConflitoEntreTransacoes({ cause: { code: '40001' } })).toBe(true);
  });

  it('nao confunde outros erros com conflito entre transacoes', () => {
    expect(ehConflitoEntreTransacoes(new Error('falha qualquer'))).toBe(false);
    expect(ehConflitoEntreTransacoes({ cause: { originalCode: '23P01' } })).toBe(false);
    expect(ehConflitoEntreTransacoes(null)).toBe(false);
  });
});
