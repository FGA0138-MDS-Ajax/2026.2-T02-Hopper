import { criarApp } from './app';
import { env } from './config/env';
import { prisma } from './infra/prisma';

const app = criarApp();

const servidor = app.listen(env.PORT, () => {
  console.log(`API do AulaCerta em execução na porta ${env.PORT}`);
});

function encerrar(): void {
  servidor.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
}

process.on('SIGTERM', encerrar);
process.on('SIGINT', encerrar);
