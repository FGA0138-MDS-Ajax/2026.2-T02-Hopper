import { Prisma } from '@prisma/client';

const CODIGO_VIOLACAO_EXCLUSAO = '23P01';
const CODIGO_VIOLACAO_UNICIDADE = 'P2002';
/** Prisma: a transação falhou por conflito de escrita ou deadlock. */
const CODIGO_CONFLITO_DE_ESCRITA = 'P2034';
/** PostgreSQL: falha de serialização (40001) e deadlock detectado (40P01). */
const CODIGOS_CONFLITO_DO_BANCO = ['40001', '40P01'];

function lerCodigoDoDriver(erro: unknown): string | undefined {
  if (typeof erro !== 'object' || erro === null) return undefined;
  const causa = (erro as { cause?: unknown }).cause;
  if (typeof causa !== 'object' || causa === null) return undefined;
  const { originalCode, code } = causa as { originalCode?: unknown; code?: unknown };
  if (typeof originalCode === 'string') return originalCode;
  return typeof code === 'string' ? code : undefined;
}

export function ehViolacaoDeExclusao(erro: unknown): boolean {
  if (lerCodigoDoDriver(erro) === CODIGO_VIOLACAO_EXCLUSAO) return true;
  if (erro instanceof Prisma.PrismaClientKnownRequestError) {
    const meta = erro.meta as { code?: string } | undefined;
    if (meta?.code === CODIGO_VIOLACAO_EXCLUSAO) return true;
  }
  const mensagem = erro instanceof Error ? erro.message : '';
  return (
    mensagem.includes(CODIGO_VIOLACAO_EXCLUSAO) ||
    mensagem.includes('aula_sem_sobreposicao') ||
    mensagem.includes('exclusion constraint')
  );
}

export function ehViolacaoDeUnicidade(erro: unknown): boolean {
  return (
    erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === CODIGO_VIOLACAO_UNICIDADE
  );
}

/**
 * Duas transações disputaram as mesmas linhas e o banco desfez uma delas. Nada foi gravado pela
 * transação desfeita; quem chamou pode tentar de novo.
 */
export function ehConflitoEntreTransacoes(erro: unknown): boolean {
  if (
    erro instanceof Prisma.PrismaClientKnownRequestError &&
    erro.code === CODIGO_CONFLITO_DE_ESCRITA
  ) {
    return true;
  }
  const causa =
    typeof erro === 'object' && erro !== null ? (erro as { cause?: unknown }).cause : undefined;
  if (
    typeof causa === 'object' &&
    causa !== null &&
    (causa as { kind?: unknown }).kind === 'TransactionWriteConflict'
  ) {
    return true;
  }
  const codigo = lerCodigoDoDriver(erro);
  return codigo !== undefined && CODIGOS_CONFLITO_DO_BANCO.includes(codigo);
}
