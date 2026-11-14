import type { Mock } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

export function criarReq(dados: Partial<Request> = {}): Request {
  return { headers: {}, params: {}, query: {}, body: undefined, ...dados } as Request;
}

export type ResMock = Response & { status: Mock; json: Mock; send: Mock };

export function criarRes(): ResMock {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return res as unknown as ResMock;
}

export function criarProximo(): NextFunction {
  return vi.fn();
}
