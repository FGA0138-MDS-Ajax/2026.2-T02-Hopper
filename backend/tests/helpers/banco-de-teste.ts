import 'dotenv/config';

/**
 * Banco dos testes de integração. Os testes APAGAM tudo o que houver nele, então ele precisa ser
 * separado do banco do app (DATABASE_URL). Lido do backend/.env; sem a variável, usa o banco-teste
 * do docker-compose.yml.
 */
export const URL_BANCO_DE_TESTE =
  process.env.DATABASE_URL_TESTE ??
  'postgresql://aulacerta:aulacerta@localhost:5433/aulacerta_teste';

/** Servidor + nome do banco: é o que diz se duas URLs apontam para o mesmo banco. */
function identificarBanco(url: string): string {
  const { hostname, port, pathname } = new URL(url);
  return `${hostname}:${port || '5432'}${pathname}`;
}

/**
 * Impede que os testes apaguem o banco do app por engano (ex.: DATABASE_URL_TESTE copiada do
 * DATABASE_URL). Recebe as URLs para poder ser testada.
 */
export function conferirBancoDeTeste(urlDeTeste: string, urlDoApp: string | undefined): void {
  if (urlDoApp && identificarBanco(urlDeTeste) === identificarBanco(urlDoApp)) {
    throw new Error(
      'DATABASE_URL_TESTE aponta para o mesmo banco que DATABASE_URL. Os testes de integração apagam ' +
        'todos os dados do banco de teste; use um banco separado (ex.: aulacerta_teste).',
    );
  }
}

/** Para o cliente "pg": o parâmetro schema é do Prisma; sslmode e os demais seguem (o Neon exige TLS). */
export function urlParaClientePg(url: string): string {
  const resultado = new URL(url);
  resultado.searchParams.delete('schema');
  return resultado.toString();
}
