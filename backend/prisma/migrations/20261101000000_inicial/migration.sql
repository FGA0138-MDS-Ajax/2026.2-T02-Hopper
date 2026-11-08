CREATE TYPE "Perfil" AS ENUM ('ALUNO', 'PROFESSOR', 'ADMIN');
CREATE TYPE "Modalidade" AS ENUM ('ONLINE', 'PRESENCIAL', 'DOMICILIO');
CREATE TYPE "StatusAula" AS ENUM ('SOLICITADA', 'CONFIRMADA', 'RECUSADA', 'REMARCADA', 'CANCELADA', 'REALIZADA');
CREATE TYPE "TipoNotificacao" AS ENUM ('SOLICITACAO', 'CONFIRMACAO', 'RECUSA', 'REMARCACAO', 'CANCELAMENTO', 'LEMBRETE');

CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "telefone" TEXT,
    "perfil" "Perfil" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "consentimentoLgpdEm" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PerfilProfessor" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "apresentacao" TEXT NOT NULL DEFAULT '',
    "valorHora" DECIMAL(10,2),
    "modalidades" "Modalidade"[],
    CONSTRAINT "PerfilProfessor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Materia" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    CONSTRAINT "Materia_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Disponibilidade" (
    "id" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    CONSTRAINT "Disponibilidade_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BloqueioHorario" (
    "id" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT,
    CONSTRAINT "BloqueioHorario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Aula" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "materiaId" TEXT NOT NULL,
    "inicio" TIMESTAMPTZ(3) NOT NULL,
    "fim" TIMESTAMPTZ(3) NOT NULL,
    "modalidade" "Modalidade" NOT NULL,
    "objetivo" TEXT,
    "status" "StatusAula" NOT NULL DEFAULT 'SOLICITADA',
    "anotacoes" TEXT,
    "motivoCancelamento" TEXT,
    "serieId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Aula_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HistoricoStatus" (
    "id" TEXT NOT NULL,
    "aulaId" TEXT NOT NULL,
    "status" "StatusAula" NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" TEXT,
    "autorId" TEXT,
    CONSTRAINT "HistoricoStatus_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Remarcacao" (
    "id" TEXT NOT NULL,
    "aulaId" TEXT NOT NULL,
    "propostoPorId" TEXT NOT NULL,
    "novoInicio" TIMESTAMP(3) NOT NULL,
    "novoFim" TIMESTAMP(3) NOT NULL,
    "aceita" BOOLEAN,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Remarcacao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Avaliacao" (
    "id" TEXT NOT NULL,
    "aulaId" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT,
    CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notificacao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "aulaId" TEXT,
    "tipo" "TipoNotificacao" NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "chaveUnica" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TokenRecuperacaoSenha" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    CONSTRAINT "TokenRecuperacaoSenha_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "_ProfessorMaterias" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ProfessorMaterias_AB_pkey" PRIMARY KEY ("A", "B")
);

CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
CREATE UNIQUE INDEX "PerfilProfessor_usuarioId_key" ON "PerfilProfessor"("usuarioId");
CREATE INDEX "Materia_nome_idx" ON "Materia"("nome");
CREATE UNIQUE INDEX "Materia_nome_nivel_key" ON "Materia"("nome", "nivel");
CREATE INDEX "Disponibilidade_professorId_diaSemana_idx" ON "Disponibilidade"("professorId", "diaSemana");
CREATE INDEX "BloqueioHorario_professorId_inicio_idx" ON "BloqueioHorario"("professorId", "inicio");
CREATE INDEX "Aula_professorId_inicio_idx" ON "Aula"("professorId", "inicio");
CREATE INDEX "Aula_alunoId_status_idx" ON "Aula"("alunoId", "status");
CREATE INDEX "HistoricoStatus_aulaId_idx" ON "HistoricoStatus"("aulaId");
CREATE INDEX "Remarcacao_aulaId_idx" ON "Remarcacao"("aulaId");
CREATE UNIQUE INDEX "Avaliacao_aulaId_key" ON "Avaliacao"("aulaId");
CREATE UNIQUE INDEX "Notificacao_chaveUnica_key" ON "Notificacao"("chaveUnica");
CREATE INDEX "Notificacao_usuarioId_lida_idx" ON "Notificacao"("usuarioId", "lida");
CREATE UNIQUE INDEX "TokenRecuperacaoSenha_tokenHash_key" ON "TokenRecuperacaoSenha"("tokenHash");
CREATE INDEX "TokenRecuperacaoSenha_usuarioId_idx" ON "TokenRecuperacaoSenha"("usuarioId");
CREATE INDEX "_ProfessorMaterias_B_index" ON "_ProfessorMaterias"("B");

ALTER TABLE "PerfilProfessor" ADD CONSTRAINT "PerfilProfessor_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Disponibilidade" ADD CONSTRAINT "Disponibilidade_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "PerfilProfessor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BloqueioHorario" ADD CONSTRAINT "BloqueioHorario_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "PerfilProfessor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Aula" ADD CONSTRAINT "Aula_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Aula" ADD CONSTRAINT "Aula_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "PerfilProfessor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Aula" ADD CONSTRAINT "Aula_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "Materia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HistoricoStatus" ADD CONSTRAINT "HistoricoStatus_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HistoricoStatus" ADD CONSTRAINT "HistoricoStatus_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Remarcacao" ADD CONSTRAINT "Remarcacao_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Remarcacao" ADD CONSTRAINT "Remarcacao_propostoPorId_fkey" FOREIGN KEY ("propostoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TokenRecuperacaoSenha" ADD CONSTRAINT "TokenRecuperacaoSenha_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ProfessorMaterias" ADD CONSTRAINT "_ProfessorMaterias_A_fkey" FOREIGN KEY ("A") REFERENCES "Materia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ProfessorMaterias" ADD CONSTRAINT "_ProfessorMaterias_B_fkey" FOREIGN KEY ("B") REFERENCES "PerfilProfessor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
