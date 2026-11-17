import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express';
import { AppError, ErroNaoEncontrado } from '../errors';
import { ehViolacaoDeExclusao, ehViolacaoDeUnicidade } from '../utils/erros-banco';

interface CorpoDeErro {
  erro: { codigo: string; mensagem: string; detalhes: unknown };
}

function corpo(codigo: string, mensagem: string, detalhes: unknown = null): CorpoDeErro {
  return { erro: { codigo, mensagem, detalhes } };
}

function ehErroDeJson(erro: unknown): boolean {
  return (
    typeof erro === 'object' &&
    erro !== null &&
    (erro as { type?: unknown }).type === 'entity.parse.failed'
  );
}

export const rotaNaoEncontrada: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  next(
    new ErroNaoEncontrado(`Rota ${req.method} ${req.path} não encontrada`, 'ROTA_NAO_ENCONTRADA'),
  );
};

export const tratarErros: ErrorRequestHandler = (
  erro: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (erro instanceof AppError) {
    res.status(erro.status).json(corpo(erro.codigo, erro.message, erro.detalhes));
    return;
  }
  if (ehErroDeJson(erro)) {
    res.status(400).json(corpo('JSON_INVALIDO', 'O corpo da requisição não é um JSON válido'));
    return;
  }
  if (ehViolacaoDeExclusao(erro)) {
    res
      .status(409)
      .json(corpo('CONFLITO_DE_HORARIO', 'O professor já possui uma aula neste horário'));
    return;
  }
  if (ehViolacaoDeUnicidade(erro)) {
    res.status(409).json(corpo('CONFLITO', 'Registro duplicado'));
    return;
  }
  console.error('Erro inesperado', erro);
  res.status(500).json(corpo('ERRO_INTERNO', 'Erro interno do servidor'));
};
