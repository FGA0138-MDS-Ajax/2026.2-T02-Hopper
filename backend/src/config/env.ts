import 'dotenv/config';
import { z } from 'zod';
import './zod-ptbr';

const esquemaEnv = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().min(1).default('2h'),
  CORS_ORIGIN: z.string().min(1),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().min(1),
  FRONTEND_URL: z.string().url(),
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
