import { Prisma } from '@prisma/client';

const CODIGO_VIOLACAO_EXCLUSAO = '23P01';
const CODIGO_VIOLACAO_UNICIDADE = 'P2002';

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
