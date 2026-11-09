import { configuracaoDaConexao } from './conexao-banco';

describe('conexão da aplicação com o banco', () => {
  it('abre a sessão em UTC, como o adaptador do Prisma espera', () => {
    // O banco tem America/Sao_Paulo como padrão. Sem isto, o @prisma/adapter-pg lê e grava
    // TIMESTAMPTZ com 3 horas de diferença (defeito encontrado em 09/11/2026).
    expect(configuracaoDaConexao('postgresql://usuario@host/banco')).toEqual({
      connectionString: 'postgresql://usuario@host/banco',
      options: '-c TimeZone=UTC',
    });
  });
});
