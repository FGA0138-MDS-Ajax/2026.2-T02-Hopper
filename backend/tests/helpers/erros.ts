import type { AppError } from '../../src/shared/errors';

export async function capturarErro(operacao: Promise<unknown>): Promise<AppError> {
  try {
    await operacao;
  } catch (erro) {
    return erro as AppError;
  }
  throw new Error('A operação deveria ter falhado, mas foi concluída');
}
