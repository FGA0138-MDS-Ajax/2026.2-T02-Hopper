import { z } from 'zod';

// Mesmas regras da API (backend/src/modules/auth/auth.schemas.ts).

export const esquemaEmail = z.string().trim().min(1, 'Informe seu e-mail.').email('Informe um e-mail válido.');

export const esquemaSenhaNova = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
  .max(72, 'Use no máximo 72 caracteres.')
  .refine((senha) => /[A-Za-z]/.test(senha) && /\d/.test(senha), 'Use letras e números na senha.');

export const DICA_SENHA = 'Pelo menos 8 caracteres, com letras e números.';
