CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Aula"
  ADD CONSTRAINT aula_sem_sobreposicao
  EXCLUDE USING gist (
    "professorId" WITH =,
    tstzrange("inicio", "fim", '[)') WITH &&
  ) WHERE (status IN ('CONFIRMADA', 'REMARCADA'));
