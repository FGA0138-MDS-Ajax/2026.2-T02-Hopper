import { z } from 'zod';

// Mesmas regras da API (backend/src/modules/auth/auth.schemas.ts).

export const esquemaEmail = z.string().trim().min(1, 'Informe seu e-mail.').email('Informe um e-mail válido.');

export const esquemaSenhaNova = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
  .max(72, 'Use no máximo 72 caracteres.')
  .refine((senha) => /[A-Za-z]/.test(senha) && /\d/.test(senha), 'Use letras e números na senha.');

export const esquemaNome = z
  .string()
  .trim()
  .min(2, 'Informe seu nome completo.')
  .max(100, 'Use no máximo 100 caracteres.');

/** Telefone opcional: aceita máscara ("(61) 99999-9999") e devolve só os números; vazio vira "". */
export const esquemaTelefoneOpcional = z
  .string()
  .transform((valor) => valor.replace(/\D/g, ''))
  .refine((valor) => valor === '' || /^\d{10,11}$/.test(valor), 'Informe o DDD e o número (10 ou 11 dígitos).');

export const DICA_SENHA = 'Pelo menos 8 caracteres, com letras e números.';
