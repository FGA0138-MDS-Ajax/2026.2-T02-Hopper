import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';
import { URL_BANCO_DE_TESTE, conferirBancoDeTeste, urlParaClientePg } from './banco-de-teste';

const PASTA_DE_MIGRACOES = join(__dirname, '..', '..', 'prisma', 'migrations');

/**
 * Roda uma vez antes dos testes de integração: zera o banco de teste e aplica as migrações.
 * Em vez de apagar e recriar o banco (exige permissão de criar bancos), recria o schema public:
 * funciona igual no PostgreSQL do docker-compose e num banco do Neon. O banco precisa existir.
 */
export default async function prepararBanco(): Promise<void> {
  conferirBancoDeTeste(URL_BANCO_DE_TESTE, process.env.DATABASE_URL);

  const cliente = new Client({ connectionString: urlParaClientePg(URL_BANCO_DE_TESTE) });
  await cliente.connect();
  try {
    await cliente.query('DROP SCHEMA IF EXISTS public CASCADE');
    await cliente.query('CREATE SCHEMA public');
    const pastas = readdirSync(PASTA_DE_MIGRACOES, { withFileTypes: true })
      .filter((item) => item.isDirectory())
      .map((item) => item.name)
      .sort();
    for (const pasta of pastas) {
      await cliente.query(readFileSync(join(PASTA_DE_MIGRACOES, pasta, 'migration.sql'), 'utf8'));
    }
  } finally {
    await cliente.end();
  }
}
