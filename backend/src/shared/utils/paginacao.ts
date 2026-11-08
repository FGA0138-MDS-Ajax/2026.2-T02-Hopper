import { z } from 'zod';
import type { Pagina, Paginacao } from '../types/dominio';

const LIMITE_PADRAO = 10;
const LIMITE_MAXIMO = 50;

export const esquemaPaginacao = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(LIMITE_MAXIMO).default(LIMITE_PADRAO),
});

export function calcularPaginacao(entrada: { pagina: number; limite: number }): Paginacao {
  return {
    pagina: entrada.pagina,
    limite: entrada.limite,
    pular: (entrada.pagina - 1) * entrada.limite,
  };
}

export function montarPagina<T>(itens: T[], total: number, pagina: number): Pagina<T> {
  return { itens, total, pagina };
}
