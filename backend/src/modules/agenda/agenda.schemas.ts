import { z } from 'zod';
import { horaParaMinutos } from '../../shared/utils/datas';
import { esquemaDataHora, esquemaHora } from '../../shared/utils/validacoes';

const MAXIMO_DE_FAIXAS = 50;
const TAMANHO_MAXIMO_MOTIVO = 200;

const esquemaFaixa = z
  .object({
    diaSemana: z.number().int().min(0).max(6),
    horaInicio: esquemaHora,
    horaFim: esquemaHora,
  })
  .refine((faixa) => horaParaMinutos(faixa.horaInicio) < horaParaMinutos(faixa.horaFim), {
    message: 'A hora de início deve ser anterior à hora de fim',
    path: ['horaFim'],
  });

export const esquemaSubstituirGrade = z.object({
  faixas: z.array(esquemaFaixa).max(MAXIMO_DE_FAIXAS),
});

export const esquemaCriarBloqueio = z
  .object({
    inicio: esquemaDataHora,
    fim: esquemaDataHora,
    motivo: z.string().trim().min(1).max(TAMANHO_MAXIMO_MOTIVO).optional(),
  })
  .refine((bloqueio) => bloqueio.inicio.getTime() < bloqueio.fim.getTime(), {
    message: 'O início deve ser anterior ao fim',
    path: ['fim'],
  });

export type EntradaSubstituirGrade = z.infer<typeof esquemaSubstituirGrade>;
export type EntradaCriarBloqueio = z.infer<typeof esquemaCriarBloqueio>;
