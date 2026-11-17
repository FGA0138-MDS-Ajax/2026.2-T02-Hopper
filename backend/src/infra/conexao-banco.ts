import type { PoolConfig } from 'pg';

/**
 * Configuração da conexão da aplicação com o PostgreSQL.
 *
 * O banco tem America/Sao_Paulo como fuso padrão, para quem consulta direto (SQL Editor do Neon, psql)
 * ver as datas no horário de Brasília. O adaptador do Prisma (@prisma/adapter-pg), porém, lê e grava
 * TIMESTAMPTZ supondo que a sessão está em UTC; com outro fuso, as datas saem deslocadas.
 * Por isso a sessão da aplicação é aberta em UTC. Os instantes guardados são os mesmos; o horário de
 * Brasília continua sendo aplicado nos cálculos (shared/utils/datas.ts) e nas respostas da API.
 */
export function configuracaoDaConexao(urlDoBanco: string | undefined): PoolConfig {
  return {
    connectionString: urlDoBanco,
    options: '-c TimeZone=UTC',
  };
}
