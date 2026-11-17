import 'dotenv/config';
import { z } from 'zod';
import './zod-ptbr';

/** Variável opcional: vazia ("BREVO_API_KEY=") conta como não configurada. */
const textoOpcional = z
  .string()
  .trim()
  .optional()
  .transform((valor) => (valor ? valor : undefined));

const esquemaEnv = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3333),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().min(1).default('2h'),
    CORS_ORIGIN: z.string().min(1),
    // E-mail transacional (recuperação de senha) pela API do Brevo.
    BREVO_API_KEY: textoOpcional,
    EMAIL_REMETENTE: z.string().trim().email().default('nao-responda@aulacerta.com.br'),
    EMAIL_REMETENTE_NOME: z.string().trim().min(1).default('AulaCerta'),
    FRONTEND_URL: z.string().url(),
  })
  .superRefine((valores, contexto) => {
    if (valores.NODE_ENV === 'production' && !valores.BREVO_API_KEY) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['BREVO_API_KEY'],
        message:
          'Obrigatória em produção (sem ela, o e-mail de recuperação de senha não é enviado)',
      });
    }
  });

function carregarEnv(): z.infer<typeof esquemaEnv> {
  const resultado = esquemaEnv.safeParse(process.env);
  if (!resultado.success) {
    const problemas = resultado.error.issues
      .map((problema) => `${problema.path.join('.')}: ${problema.message}`)
      .join('; ');
    throw new Error(`Variáveis de ambiente inválidas: ${problemas}`);
  }
  return resultado.data;
}

export const env = carregarEnv();
