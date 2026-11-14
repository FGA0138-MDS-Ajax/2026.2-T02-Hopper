import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { z } from 'zod';
import { ErroValidacao } from '../errors';

type OrigemDosDados = 'params' | 'query' | 'body';

export interface EsquemasDaRequisicao {
  params?: z.ZodType;
  body?: z.ZodType;
}

interface DetalheDeValidacao {
  campo: string;
  mensagem: string;
}

const ORIGENS: Exclude<OrigemDosDados, 'query'>[] = ['params', 'body'];

function substituir(req: Request, origem: OrigemDosDados, valor: unknown): void {
  Object.defineProperty(req, origem, {
    value: valor,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

function detalhesDoErro(origem: OrigemDosDados, erro: z.ZodError): DetalheDeValidacao[] {
  return erro.issues.map((problema) => {
    const caminho = problema.path.join('.');
    return { campo: caminho ? `${origem}.${caminho}` : origem, mensagem: problema.message };
  });
}

/** Valida params e body da rota e troca cada um pelos dados já convertidos pelo esquema. */
export function validar(esquemas: EsquemasDaRequisicao): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const detalhes: DetalheDeValidacao[] = [];
    for (const origem of ORIGENS) {
      const esquema = esquemas[origem];
      if (!esquema) continue;
      const resultado = esquema.safeParse(req[origem]);
      if (resultado.success) substituir(req, origem, resultado.data);
      else detalhes.push(...detalhesDoErro(origem, resultado.error));
    }
    if (detalhes.length > 0) throw new ErroValidacao('Dados inválidos', detalhes);
    next();
  };
}

/**
 * Valida a query da requisição e devolve os dados convertidos (números, datas, booleanos), já com
 * o tipo do esquema. O Express tipa req.query sempre como texto; por isso a query é lida aqui, no
 * controlador, em vez de ser trocada por um middleware. Erro: 422 com campo "query.<nome>".
 */
export function lerConsulta<Esquema extends z.ZodType>(
  req: Request,
  esquema: Esquema,
): z.output<Esquema> {
  const resultado = esquema.safeParse(req.query);
  if (!resultado.success) {
    throw new ErroValidacao('Dados inválidos', detalhesDoErro('query', resultado.error));
  }
  return resultado.data;
}
