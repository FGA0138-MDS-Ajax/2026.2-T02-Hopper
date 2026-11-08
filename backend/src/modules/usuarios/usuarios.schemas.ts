import { z } from 'zod';
import { esquemaPaginacao } from '../../shared/utils/paginacao';
import { esquemaId, esquemaTelefone } from '../../shared/utils/validacoes';

const TAMANHO_MAXIMO_APRESENTACAO = 1000;
const TAMANHO_MAXIMO_FILTRO = 100;
const VALOR_HORA_MAXIMO = 10_000;
const MAXIMO_DE_MATERIAS = 20;

export const esquemaModalidade = z.enum(['ONLINE', 'PRESENCIAL', 'DOMICILIO']);

export const esquemaBuscaProfessores = esquemaPaginacao.extend({
  materia: z.string().trim().min(1).max(TAMANHO_MAXIMO_FILTRO).optional(),
  nivel: z.string().trim().min(1).max(TAMANHO_MAXIMO_FILTRO).optional(),
  modalidade: esquemaModalidade.optional(),
});

export const esquemaAtualizarPerfilProfessor = z.object({
  apresentacao: z.string().trim().min(1).max(TAMANHO_MAXIMO_APRESENTACAO),
  valorHora: z.number().positive().max(VALOR_HORA_MAXIMO).multipleOf(0.01),
  modalidades: z
    .array(esquemaModalidade)
    .min(1)
    .max(3)
    .transform((modalidades) => [...new Set(modalidades)]),
  materiaIds: z
    .array(esquemaId)
    .min(1)
    .max(MAXIMO_DE_MATERIAS)
    .transform((ids) => [...new Set(ids)]),
});

export const esquemaAtualizarUsuario = z
  .object({
    nome: z.string().trim().min(2).max(100).optional(),
    telefone: esquemaTelefone.nullable().optional(),
  })
  .refine((dados) => dados.nome !== undefined || dados.telefone !== undefined, {
    message: 'Informe ao menos um campo para atualizar',
  });

export type EntradaBuscaProfessores = z.infer<typeof esquemaBuscaProfessores>;
export type EntradaAtualizarPerfilProfessor = z.infer<typeof esquemaAtualizarPerfilProfessor>;
export type EntradaAtualizarUsuario = z.infer<typeof esquemaAtualizarUsuario>;
