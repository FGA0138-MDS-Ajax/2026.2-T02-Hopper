import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { ErroValidacao } from '../errors';

type OrigemDosDados = 'params' | 'query' | 'body';

export interface EsquemasDaRequisicao {
  params?: ZodTypeAny;
  query?: ZodTypeAny;
  body?: ZodTypeAny;
}

const ORIGENS: OrigemDosDados[] = ['params', 'query', 'body'];

function substituir(req: Request, origem: OrigemDosDados, valor: unknown): void {
  Object.defineProperty(req, origem, {
    value: valor,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

export function validar(esquemas: EsquemasDaRequisicao): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const detalhes: { campo: string; mensagem: string }[] = [];
    for (const origem of ORIGENS) {
      const esquema = esquemas[origem];
      if (!esquema) continue;
      const resultado = esquema.safeParse(req[origem]);
      if (resultado.success) {
        substituir(req, origem, resultado.data);
        continue;
      }
      for (const problema of resultado.error.issues) {
        const caminho = problema.path.join('.');
        detalhes.push({
          campo: caminho ? `${origem}.${caminho}` : origem,
          mensagem: problema.message,
        });
      }
    }
    if (detalhes.length > 0) throw new ErroValidacao('Dados inválidos', detalhes);
    next();
  };
}
