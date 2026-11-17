import { z } from 'zod';
import { esquemaPaginacao } from '../../shared/utils/paginacao';
import { esquemaDataHora, esquemaId } from '../../shared/utils/validacoes';
import { esquemaModalidade } from '../usuarios/usuarios.schemas';

const DURACAO_MINIMA_MINUTOS = 30;
const DURACAO_MAXIMA_MINUTOS = 240;
const TAMANHO_MAXIMO_OBJETIVO = 500;
const TAMANHO_MAXIMO_MOTIVO = 300;
const MS_POR_MINUTO = 60_000;
const MINIMO_DE_SEMANAS = 2;
const MAXIMO_DE_SEMANAS = 12;

const esquemaStatusAula = z.enum([
  'SOLICITADA',
  'CONFIRMADA',
  'RECUSADA',
  'REMARCADA',
  'CANCELADA',
  'REALIZADA',
]);

export const esquemaCriarAula = z
  .object({
    professorId: esquemaId,
    materiaId: esquemaId,
    inicio: esquemaDataHora,
    fim: esquemaDataHora,
    modalidade: esquemaModalidade,
    objetivo: z.string().trim().min(1).max(TAMANHO_MAXIMO_OBJETIVO).optional(),
    recorrencia: z
      .object({ semanas: z.number().int().min(MINIMO_DE_SEMANAS).max(MAXIMO_DE_SEMANAS) })
      .optional(),
  })
  .refine((aula) => aula.inicio.getTime() < aula.fim.getTime(), {
    message: 'O início deve ser anterior ao fim',
    path: ['fim'],
  })
  .refine(
    (aula) => {
      const minutos = (aula.fim.getTime() - aula.inicio.getTime()) / MS_POR_MINUTO;
      return minutos >= DURACAO_MINIMA_MINUTOS && minutos <= DURACAO_MAXIMA_MINUTOS;
    },
    {
      message: `A aula deve durar entre ${DURACAO_MINIMA_MINUTOS} e ${DURACAO_MAXIMA_MINUTOS} minutos`,
      path: ['fim'],
    },
  );

export const esquemaListarAulas = esquemaPaginacao
  .extend({
    status: esquemaStatusAula.optional(),
    de: esquemaDataHora.optional(),
    ate: esquemaDataHora.optional(),
  })
  .refine(
    (consulta) => !consulta.de || !consulta.ate || consulta.de.getTime() <= consulta.ate.getTime(),
    {
      message: 'A data inicial deve ser anterior à data final',
      path: ['ate'],
    },
  );

export const esquemaAceitarAula = z.object({ serie: z.boolean().optional() }).default({});

export const esquemaRecusarAula = z
  .object({ motivo: z.string().trim().min(1).max(TAMANHO_MAXIMO_MOTIVO).optional() })
  .default({});

export type EntradaCriarAula = z.infer<typeof esquemaCriarAula>;
export type EntradaListarAulas = z.infer<typeof esquemaListarAulas>;
export type EntradaAceitarAula = z.infer<typeof esquemaAceitarAula>;
export type EntradaRecusarAula = z.infer<typeof esquemaRecusarAula>;
