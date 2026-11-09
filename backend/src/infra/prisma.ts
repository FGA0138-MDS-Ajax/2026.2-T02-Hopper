import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { configuracaoDaConexao } from './conexao-banco';

export const prisma = new PrismaClient({
  adapter: new PrismaPg(configuracaoDaConexao(env.DATABASE_URL)),
});

export type Transacao = Prisma.TransactionClient;

const ESPERA_MAXIMA_MS = 5_000;
const TEMPO_LIMITE_MS = 10_000;

export function transacao<T>(operacao: (tx: Transacao) => Promise<T>): Promise<T> {
  return prisma.$transaction(operacao, { maxWait: ESPERA_MAXIMA_MS, timeout: TEMPO_LIMITE_MS });
}
