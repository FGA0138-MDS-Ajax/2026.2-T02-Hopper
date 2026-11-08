import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';
import { URL_BANCO_DE_TESTE } from './banco-de-teste';

const PASTA_DE_MIGRACOES = join(__dirname, '..', '..', 'prisma', 'migrations');

function nomeDoBanco(url: string): string {
  return new URL(url).pathname.replace(/^\//, '');
}

function urlAdministrativa(url: string): string {
  const administrativa = new URL(url);
  administrativa.pathname = '/postgres';
  administrativa.search = '';
  return administrativa.toString();
}

function urlSemParametros(url: string): string {
  const limpa = new URL(url);
  limpa.search = '';
  return limpa.toString();
}

export default async function prepararBanco(): Promise<void> {
  const nome = nomeDoBanco(URL_BANCO_DE_TESTE);
  const administrador = new Client({ connectionString: urlAdministrativa(URL_BANCO_DE_TESTE) });
  await administrador.connect();
  await administrador.query(`DROP DATABASE IF EXISTS "${nome}" WITH (FORCE)`);
  await administrador.query(`CREATE DATABASE "${nome}"`);
  await administrador.end();

  const cliente = new Client({ connectionString: urlSemParametros(URL_BANCO_DE_TESTE) });
  await cliente.connect();
  const pastas = readdirSync(PASTA_DE_MIGRACOES, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => item.name)
    .sort();
  for (const pasta of pastas) {
    await cliente.query(readFileSync(join(PASTA_DE_MIGRACOES, pasta, 'migration.sql'), 'utf8'));
  }
  await cliente.end();
}
