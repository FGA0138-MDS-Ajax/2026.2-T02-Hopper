import { z } from 'zod';

const mapaDeErros: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === 'undefined') return { message: 'Campo obrigatório' };
      return { message: `Tipo inválido: esperado ${issue.expected}` };
    case z.ZodIssueCode.too_small:
      if (issue.type === 'string')
        return { message: `Deve ter no mínimo ${issue.minimum} caracteres` };
      if (issue.type === 'array') return { message: `Deve ter no mínimo ${issue.minimum} itens` };
      return { message: `Deve ser maior ou igual a ${issue.minimum}` };
    case z.ZodIssueCode.too_big:
      if (issue.type === 'string')
        return { message: `Deve ter no máximo ${issue.maximum} caracteres` };
      if (issue.type === 'array') return { message: `Deve ter no máximo ${issue.maximum} itens` };
      return { message: `Deve ser menor ou igual a ${issue.maximum}` };
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'email') return { message: 'E-mail inválido' };
      if (issue.validation === 'uuid') return { message: 'Identificador inválido' };
      if (issue.validation === 'datetime') {
        return { message: 'Data e hora inválidas (use o formato ISO 8601)' };
      }
      return { message: 'Formato inválido' };
    case z.ZodIssueCode.invalid_enum_value:
      return { message: `Valor inválido. Opções: ${issue.options.join(', ')}` };
    case z.ZodIssueCode.invalid_literal:
      return { message: 'Valor inválido' };
    default:
      return { message: ctx.defaultError };
  }
};

z.setErrorMap(mapaDeErros);
