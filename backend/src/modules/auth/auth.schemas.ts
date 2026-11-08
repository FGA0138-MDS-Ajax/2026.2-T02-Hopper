import { z } from 'zod';
import { esquemaTelefone } from '../../shared/utils/validacoes';

const esquemaEmail = z.string().trim().toLowerCase().email().max(254);

const esquemaSenhaNova = z
  .string()
  .min(8)
  .max(72)
  .refine((senha) => /[A-Za-z]/.test(senha) && /\d/.test(senha), {
    message: 'A senha deve conter letras e números',
  });

export const esquemaCadastro = z.object({
  nome: z.string().trim().min(2).max(100),
  email: esquemaEmail,
  senha: esquemaSenhaNova,
  telefone: esquemaTelefone.optional(),
  perfil: z.enum(['ALUNO', 'PROFESSOR']),
  consentimentoLgpd: z.boolean().refine((aceito) => aceito, {
    message: 'É necessário consentir com o tratamento de dados (LGPD)',
  }),
});

export const esquemaLogin = z.object({
  email: esquemaEmail,
  senha: z.string().min(1).max(72),
});

export const esquemaRecuperarSenha = z.object({
  email: esquemaEmail,
});

export const esquemaRedefinirSenha = z.object({
  token: z.string().trim().min(1).max(200),
  novaSenha: esquemaSenhaNova,
});

export type EntradaCadastro = z.infer<typeof esquemaCadastro>;
export type EntradaLogin = z.infer<typeof esquemaLogin>;
export type EntradaRecuperarSenha = z.infer<typeof esquemaRecuperarSenha>;
export type EntradaRedefinirSenha = z.infer<typeof esquemaRedefinirSenha>;
