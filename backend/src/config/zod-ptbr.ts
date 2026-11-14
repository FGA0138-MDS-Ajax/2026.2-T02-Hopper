import { z } from 'zod';

type Problema = Parameters<NonNullable<z.core.$ZodConfig['customError']>>[0];

const FORMATOS: Record<string, string> = {
  email: 'E-mail inválido',
  uuid: 'Identificador inválido',
  guid: 'Identificador inválido',
  datetime: 'Data e hora inválidas (use o formato ISO 8601)',
  url: 'Endereço (URL) inválido',
};

function limite(problema: Problema, tipo: 'minimo' | 'maximo'): string | undefined {
  if (problema.code !== 'too_small' && problema.code !== 'too_big') return undefined;
  const valor = String(tipo === 'minimo' ? problema.minimum : problema.maximum);
  const noMinimo = tipo === 'minimo' ? 'no mínimo' : 'no máximo';
  if (problema.origin === 'string') return `Deve ter ${noMinimo} ${valor} caracteres`;
  if (problema.origin === 'array' || problema.origin === 'set')
    return `Deve ter ${noMinimo} ${valor} itens`;
  const comparacao = tipo === 'minimo' ? 'maior' : 'menor';
  return problema.inclusive === false
    ? `Deve ser ${comparacao} que ${valor}`
    : `Deve ser ${comparacao} ou igual a ${valor}`;
}

/**
 * Mensagens de validação da API em português. Cobre os casos usados nos esquemas; os demais
 * caem nas mensagens em português que o próprio Zod traz (locale pt-BR).
 */
function mensagemEmPortugues(problema: Problema): string | undefined {
  switch (problema.code) {
    case 'invalid_type':
      if (problema.input === undefined) return 'Campo obrigatório';
      return `Tipo inválido: esperado ${problema.expected}`;
    case 'too_small':
      return limite(problema, 'minimo');
    case 'too_big':
      return limite(problema, 'maximo');
    case 'invalid_format':
      return FORMATOS[problema.format] ?? 'Formato inválido';
    case 'invalid_value':
      return problema.values.length > 1
        ? `Valor inválido. Opções: ${problema.values.join(', ')}`
        : 'Valor inválido';
    default:
      return undefined;
  }
}

z.config(z.locales.ptBR());
z.config({ customError: mensagemEmPortugues });
