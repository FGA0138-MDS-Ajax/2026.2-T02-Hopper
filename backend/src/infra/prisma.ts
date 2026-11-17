import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { ErroConflito } from '../shared/errors';
import { ehConflitoEntreTransacoes } from '../shared/utils/erros-banco';
import { configuracaoDaConexao } from './conexao-banco';

export const prisma = new PrismaClient({
  adapter: new PrismaPg(configuracaoDaConexao(env.DATABASE_URL)),
});

export type Transacao = Prisma.TransactionClient;

const ESPERA_MAXIMA_MS = 5_000;
const TEMPO_LIMITE_MS = 10_000;

/**
 * Executa a operação numa transação. Se o banco a desfizer por disputa com outra transação
 * (deadlock ou conflito de escrita), responde 409 em vez de erro interno: nada foi gravado.
 */
export async function transacao<T>(operacao: (tx: Transacao) => Promise<T>): Promise<T> {
  try {
    return await prisma.$transaction(operacao, {
      maxWait: ESPERA_MAXIMA_MS,
      timeout: TEMPO_LIMITE_MS,
    });
  } catch (erro) {
    if (ehConflitoEntreTransacoes(erro)) {
      throw new ErroConflito(
        'A agenda mudou durante a operação. Atualize a página e tente novamente',
        'OPERACAO_CONCORRENTE',
      );
    }
    throw erro;
  }
}
