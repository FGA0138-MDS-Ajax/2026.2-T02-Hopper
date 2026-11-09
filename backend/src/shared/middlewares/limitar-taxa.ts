import rateLimit from 'express-rate-limit';
import { env } from '../../config/env';

const JANELA_MS = 15 * 60 * 1000;
const MAXIMO_LOGIN = 10;
const MAXIMO_RECUPERACAO = 5;

function criarLimitador(maximo: number, mensagem: string) {
  return rateLimit({
    windowMs: JANELA_MS,
    limit: maximo,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    handler: (_req, res) => {
      res.status(429).json({ erro: { codigo: 'MUITAS_TENTATIVAS', mensagem, detalhes: null } });
    },
  });
}

export const limitadorLogin = criarLimitador(
  MAXIMO_LOGIN,
  'Muitas tentativas de login. Tente novamente mais tarde',
);

export const limitadorRecuperacao = criarLimitador(
  MAXIMO_RECUPERACAO,
  'Muitas solicitações de recuperação de senha. Tente novamente mais tarde',
);
