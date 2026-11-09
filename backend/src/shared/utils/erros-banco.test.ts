import { ehViolacaoDeExclusao, ehViolacaoDeUnicidade } from './erros-banco';

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
});
