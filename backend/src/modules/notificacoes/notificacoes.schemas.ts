import { z } from 'zod';
import { esquemaPaginacao } from '../../shared/utils/paginacao';
import { esquemaId } from '../../shared/utils/validacoes';

const MAXIMO_DE_IDS = 100;

export const esquemaListarNotificacoes = esquemaPaginacao.extend({
  apenasNaoLidas: z
    .enum(['true', 'false'])
    .default('false')
    .transform((valor) => valor === 'true'),
});

export const esquemaMarcarComoLidas = z
  .object({
    ids: z.array(esquemaId).min(1).max(MAXIMO_DE_IDS).optional(),
    todas: z.literal(true).optional(),
  })
  .refine((dados) => (dados.ids !== undefined) !== (dados.todas !== undefined), {
    message: 'Informe a lista de ids ou todas: true, mas não os dois',
  });

export type EntradaListarNotificacoes = z.infer<typeof esquemaListarNotificacoes>;
export type EntradaMarcarComoLidas = z.infer<typeof esquemaMarcarComoLidas>;
