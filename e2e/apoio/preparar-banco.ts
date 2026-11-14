import { Client } from 'pg';
import prepararBancoDeTeste from '../../backend/tests/helpers/preparar-banco';
import { URL_BANCO_DE_TESTE, urlParaClientePg } from '../../backend/tests/helpers/banco-de-teste';

/** Matérias que o seed do back-end também cadastra; o professor escolhe entre elas no perfil. */
const MATERIAS = [
  ['Matemática', 'Ensino Médio'],
  ['Física', 'Ensino Médio'],
  ['Português', 'Ensino Fundamental'],
  ['Inglês', 'Ensino Médio'],
];

/**
 * Roda uma vez antes dos testes de sistema: zera o banco de teste e aplica as migrações (o mesmo
 * preparo dos testes de integração, com a trava que impede usar o banco do app) e cadastra as
 * matérias. Contas e aulas são criadas por cada teste, com e-mails únicos.
 */
export default async function prepararBanco(): Promise<void> {
  await prepararBancoDeTeste();
  const cliente = new Client({ connectionString: urlParaClientePg(URL_BANCO_DE_TESTE) });
  await cliente.connect();
  try {
    for (const [nome, nivel] of MATERIAS) {
      await cliente.query('INSERT INTO "Materia" (id, nome, nivel) VALUES (gen_random_uuid(), $1, $2)', [nome, nivel]);
    }
  } finally {
    await cliente.end();
  }
}
