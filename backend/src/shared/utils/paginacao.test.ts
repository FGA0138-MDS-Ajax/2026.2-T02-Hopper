import { calcularPaginacao, esquemaPaginacao, montarPagina } from './paginacao';

describe('paginacao', () => {
  it('aplica valores padrao e converte texto em numero', () => {
    expect(esquemaPaginacao.parse({})).toEqual({ pagina: 1, limite: 10 });
    expect(esquemaPaginacao.parse({ pagina: '3', limite: '20' })).toEqual({
      pagina: 3,
      limite: 20,
    });
  });

  it('rejeita limite acima do maximo e pagina zero', () => {
    expect(esquemaPaginacao.safeParse({ limite: '51' }).success).toBe(false);
    expect(esquemaPaginacao.safeParse({ pagina: '0' }).success).toBe(false);
  });

  it('calcula o deslocamento e monta a pagina', () => {
    expect(calcularPaginacao({ pagina: 3, limite: 10 })).toEqual({
      pagina: 3,
      limite: 10,
      pular: 20,
    });
    expect(montarPagina(['a'], 5, 2)).toEqual({ itens: ['a'], total: 5, pagina: 2 });
  });
});
