import type { NextFunction, Request, Response } from 'express';

export function criarReq(dados: Partial<Request> = {}): Request {
  return { headers: {}, params: {}, query: {}, body: undefined, ...dados } as Request;
}

export type ResMock = Response & { status: jest.Mock; json: jest.Mock; send: jest.Mock };

export function criarRes(): ResMock {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res as unknown as ResMock;
}

export function criarProximo(): NextFunction {
  return jest.fn();
}
