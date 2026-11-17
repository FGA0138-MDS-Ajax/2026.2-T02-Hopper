-- Fuso horário: todas as datas passam a ser TIMESTAMPTZ e o banco usa o horário de Brasília.
--
-- As colunas abaixo eram TIMESTAMP (sem fuso) e guardavam o instante em UTC.
-- "USING ... AT TIME ZONE 'UTC'" converte cada valor sem alterar o instante que ele representa.

ALTER TABLE "Usuario"
  ALTER COLUMN "consentimentoLgpdEm" TYPE TIMESTAMPTZ(3) USING "consentimentoLgpdEm" AT TIME ZONE 'UTC',
  ALTER COLUMN "criadoEm" TYPE TIMESTAMPTZ(3) USING "criadoEm" AT TIME ZONE 'UTC';

ALTER TABLE "BloqueioHorario"
  ALTER COLUMN "inicio" TYPE TIMESTAMPTZ(3) USING "inicio" AT TIME ZONE 'UTC',
  ALTER COLUMN "fim" TYPE TIMESTAMPTZ(3) USING "fim" AT TIME ZONE 'UTC';

ALTER TABLE "Aula"
  ALTER COLUMN "criadoEm" TYPE TIMESTAMPTZ(3) USING "criadoEm" AT TIME ZONE 'UTC';

ALTER TABLE "HistoricoStatus"
  ALTER COLUMN "dataHora" TYPE TIMESTAMPTZ(3) USING "dataHora" AT TIME ZONE 'UTC';

ALTER TABLE "Remarcacao"
  ALTER COLUMN "novoInicio" TYPE TIMESTAMPTZ(3) USING "novoInicio" AT TIME ZONE 'UTC',
  ALTER COLUMN "novoFim" TYPE TIMESTAMPTZ(3) USING "novoFim" AT TIME ZONE 'UTC',
  ALTER COLUMN "criadoEm" TYPE TIMESTAMPTZ(3) USING "criadoEm" AT TIME ZONE 'UTC';

ALTER TABLE "Notificacao"
  ALTER COLUMN "criadoEm" TYPE TIMESTAMPTZ(3) USING "criadoEm" AT TIME ZONE 'UTC';

ALTER TABLE "TokenRecuperacaoSenha"
  ALTER COLUMN "expiraEm" TYPE TIMESTAMPTZ(3) USING "expiraEm" AT TIME ZONE 'UTC',
  ALTER COLUMN "usadoEm" TYPE TIMESTAMPTZ(3) USING "usadoEm" AT TIME ZONE 'UTC';

-- Fuso padrão do banco: consultas (SQL Editor do Neon, psql) mostram as datas no horário de Brasília.
-- Vale para novas conexões ao banco atual, qualquer que seja o nome dele (produção, homologação, testes).
DO $$
BEGIN
  EXECUTE format('ALTER DATABASE %I SET timezone TO %L', current_database(), 'America/Sao_Paulo');
END
$$;
