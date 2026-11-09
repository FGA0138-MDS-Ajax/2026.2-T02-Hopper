import { z } from 'zod';

export const esquemaId = z.string().uuid();

export const esquemaParametroId = z.object({ id: esquemaId });

export const esquemaHora = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida (use HH:mm)');

export const esquemaDataHora = z
  .string()
  .datetime({ offset: true })
  .transform((valor) => new Date(valor));

export const esquemaTelefone = z
  .string()
  .trim()
  .regex(/^\d{10,11}$/, 'Telefone inválido (somente números com DDD)');
