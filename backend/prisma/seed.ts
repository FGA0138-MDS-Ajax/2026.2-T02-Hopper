import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { configuracaoDaConexao } from '../src/infra/conexao-banco';
import { componentesBrasilia, criarDataBrasilia, somarMinutos } from '../src/shared/utils/datas';

const CUSTO_BCRYPT = 10;
const DURACAO_DA_AULA_MINUTOS = 60;

const emailAdmin = process.env.SEED_ADMIN_EMAIL ?? 'admin@aulacerta.com.br';
const senhaPadrao = process.env.SEED_SENHA ?? 'Senha@12345';

const prisma = new PrismaClient({
  adapter: new PrismaPg(configuracaoDaConexao(process.env.DATABASE_URL)),
});

function horarioEmBrasilia(diasAPartirDeHoje: number, hora: number): { inicio: Date; fim: Date } {
  const hoje = componentesBrasilia(new Date());
  const inicio = criarDataBrasilia(hoje.ano, hoje.mes, hoje.dia + diasAPartirDeHoje, hora);
  return { inicio, fim: somarMinutos(inicio, DURACAO_DA_AULA_MINUTOS) };
}

async function criarUsuario(
  nome: string,
  email: string,
  perfil: 'ALUNO' | 'PROFESSOR' | 'ADMIN',
  telefone: string | null,
): Promise<{ id: string }> {
  return prisma.usuario.create({
    data: {
      nome,
      email,
      perfil,
      telefone,
      senhaHash: await bcrypt.hash(senhaPadrao, CUSTO_BCRYPT),
      consentimentoLgpdEm: new Date(),
    },
    select: { id: true },
  });
}

async function criarProfessor(
  usuarioId: string,
  dados: {
    apresentacao: string;
    valorHora: number;
    modalidades: Prisma.PerfilProfessorCreateInput['modalidades'];
    materiaIds: string[];
    diasDaGrade: number[];
  },
): Promise<{ id: string }> {
  return prisma.perfilProfessor.create({
    data: {
      usuarioId,
      apresentacao: dados.apresentacao,
      valorHora: dados.valorHora,
      modalidades: dados.modalidades,
      materias: { connect: dados.materiaIds.map((id) => ({ id })) },
      disponibilidades: {
        create: dados.diasDaGrade.flatMap((diaSemana) => [
          { diaSemana, horaInicio: '08:00', horaFim: '12:00' },
          { diaSemana, horaInicio: '14:00', horaFim: '18:00' },
        ]),
      },
    },
    select: { id: true },
  });
}

interface DadosAula {
  alunoId: string;
  professorId: string;
  materiaId: string;
  dias: number;
  hora: number;
  modalidade: 'ONLINE' | 'PRESENCIAL' | 'DOMICILIO';
  status: 'SOLICITADA' | 'CONFIRMADA' | 'RECUSADA' | 'REMARCADA' | 'CANCELADA' | 'REALIZADA';
  objetivo: string;
  historico: { status: DadosAula['status']; motivo?: string; autorId: string }[];
  anotacoes?: string;
  motivoCancelamento?: string;
}

async function criarAula(dados: DadosAula): Promise<{ id: string }> {
  const { inicio, fim } = horarioEmBrasilia(dados.dias, dados.hora);
  return prisma.aula.create({
    data: {
      alunoId: dados.alunoId,
      professorId: dados.professorId,
      materiaId: dados.materiaId,
      inicio,
      fim,
      modalidade: dados.modalidade,
      objetivo: dados.objetivo,
      status: dados.status,
      anotacoes: dados.anotacoes,
      motivoCancelamento: dados.motivoCancelamento,
      historico: { create: dados.historico },
    },
    select: { id: true },
  });
}

async function popular(): Promise<void> {
  const jaExiste = await prisma.usuario.findUnique({ where: { email: emailAdmin } });
  if (jaExiste) {
    console.log('Seed ignorado: o administrador já existe.');
    return;
  }

  const [matematica, fisica, portugues, ingles] = await Promise.all([
    prisma.materia.upsert({
      where: { nome_nivel: { nome: 'Matemática', nivel: 'Ensino Médio' } },
      update: {},
      create: { nome: 'Matemática', nivel: 'Ensino Médio' },
    }),
    prisma.materia.upsert({
      where: { nome_nivel: { nome: 'Física', nivel: 'Ensino Médio' } },
      update: {},
      create: { nome: 'Física', nivel: 'Ensino Médio' },
    }),
    prisma.materia.upsert({
      where: { nome_nivel: { nome: 'Português', nivel: 'Ensino Fundamental' } },
      update: {},
      create: { nome: 'Português', nivel: 'Ensino Fundamental' },
    }),
    prisma.materia.upsert({
      where: { nome_nivel: { nome: 'Inglês', nivel: 'Ensino Médio' } },
      update: {},
      create: { nome: 'Inglês', nivel: 'Ensino Médio' },
    }),
  ]);

  await criarUsuario('Administrador AulaCerta', emailAdmin, 'ADMIN', null);

  const usuarioAna = await criarUsuario(
    'Ana Souza',
    'ana.professora@aulacerta.com.br',
    'PROFESSOR',
    '61991110001',
  );
  const usuarioBruno = await criarUsuario(
    'Bruno Lima',
    'bruno.professor@aulacerta.com.br',
    'PROFESSOR',
    '61991110002',
  );
  const alunoCaio = await criarUsuario(
    'Caio Alves',
    'caio.aluno@aulacerta.com.br',
    'ALUNO',
    '61992220001',
  );
  const alunaDaniela = await criarUsuario(
    'Daniela Rocha',
    'daniela.aluna@aulacerta.com.br',
    'ALUNO',
    '61992220002',
  );

  const ana = await criarProfessor(usuarioAna.id, {
    apresentacao:
      'Professora de exatas com 8 anos de experiência em reforço e preparação para o vestibular.',
    valorHora: 90,
    modalidades: ['ONLINE', 'PRESENCIAL'],
    materiaIds: [matematica.id, fisica.id],
    diasDaGrade: [1, 2, 3, 4, 5],
  });
  const bruno = await criarProfessor(usuarioBruno.id, {
    apresentacao:
      'Professor de idiomas e redação, com foco em conversação e interpretação de texto.',
    valorHora: 70,
    modalidades: ['ONLINE', 'DOMICILIO'],
    materiaIds: [portugues.id, ingles.id],
    diasDaGrade: [1, 3, 5, 6],
  });

  await criarAula({
    alunoId: alunoCaio.id,
    professorId: ana.id,
    materiaId: matematica.id,
    dias: 2,
    hora: 14,
    modalidade: 'ONLINE',
    status: 'SOLICITADA',
    objetivo: 'Revisão de funções do 2º grau',
    historico: [{ status: 'SOLICITADA', autorId: alunoCaio.id }],
  });
  const confirmada = await criarAula({
    alunoId: alunoCaio.id,
    professorId: ana.id,
    materiaId: fisica.id,
    dias: 3,
    hora: 10,
    modalidade: 'PRESENCIAL',
    status: 'CONFIRMADA',
    objetivo: 'Cinemática',
    historico: [
      { status: 'SOLICITADA', autorId: alunoCaio.id },
      { status: 'CONFIRMADA', autorId: usuarioAna.id },
    ],
  });
  await criarAula({
    alunoId: alunaDaniela.id,
    professorId: ana.id,
    materiaId: matematica.id,
    dias: 4,
    hora: 9,
    modalidade: 'ONLINE',
    status: 'RECUSADA',
    objetivo: 'Geometria plana',
    historico: [
      { status: 'SOLICITADA', autorId: alunaDaniela.id },
      { status: 'RECUSADA', motivo: 'Horário indisponível', autorId: usuarioAna.id },
    ],
  });
  const remarcada = await criarAula({
    alunoId: alunaDaniela.id,
    professorId: ana.id,
    materiaId: matematica.id,
    dias: 6,
    hora: 15,
    modalidade: 'ONLINE',
    status: 'REMARCADA',
    objetivo: 'Trigonometria',
    historico: [
      { status: 'SOLICITADA', autorId: alunaDaniela.id },
      { status: 'CONFIRMADA', autorId: usuarioAna.id },
      { status: 'REMARCADA', autorId: alunaDaniela.id },
    ],
  });
  await prisma.remarcacao.create({
    data: {
      aulaId: remarcada.id,
      propostoPorId: usuarioAna.id,
      novoInicio: horarioEmBrasilia(6, 15).inicio,
      novoFim: horarioEmBrasilia(6, 15).fim,
      aceita: true,
    },
  });
  await criarAula({
    alunoId: alunoCaio.id,
    professorId: bruno.id,
    materiaId: ingles.id,
    dias: 5,
    hora: 11,
    modalidade: 'ONLINE',
    status: 'CANCELADA',
    objetivo: 'Conversação',
    motivoCancelamento: 'Imprevisto de saúde',
    historico: [
      { status: 'SOLICITADA', autorId: alunoCaio.id },
      { status: 'CONFIRMADA', autorId: usuarioBruno.id },
      { status: 'CANCELADA', motivo: 'Imprevisto de saúde', autorId: alunoCaio.id },
    ],
  });
  const realizada = await criarAula({
    alunoId: alunaDaniela.id,
    professorId: bruno.id,
    materiaId: portugues.id,
    dias: -3,
    hora: 10,
    modalidade: 'DOMICILIO',
    status: 'REALIZADA',
    objetivo: 'Interpretação de texto',
    anotacoes: 'Praticamos inferência e resumo. Próximo passo: redação dissertativa.',
    historico: [
      { status: 'SOLICITADA', autorId: alunaDaniela.id },
      { status: 'CONFIRMADA', autorId: usuarioBruno.id },
      { status: 'REALIZADA', autorId: usuarioBruno.id },
    ],
  });
  await prisma.avaliacao.create({
    data: { aulaId: realizada.id, nota: 5, comentario: 'Aula muito clara e objetiva.' },
  });
  await criarAula({
    alunoId: alunaDaniela.id,
    professorId: bruno.id,
    materiaId: ingles.id,
    dias: 3,
    hora: 15,
    modalidade: 'ONLINE',
    status: 'SOLICITADA',
    objetivo: 'Preparação para entrevista em inglês',
    historico: [{ status: 'SOLICITADA', autorId: alunaDaniela.id }],
  });

  await prisma.notificacao.createMany({
    data: [
      {
        usuarioId: usuarioAna.id,
        tipo: 'SOLICITACAO',
        mensagem: 'Caio Alves solicitou uma aula de Matemática.',
        chaveUnica: 'seed:solicitacao:ana',
      },
      {
        usuarioId: alunoCaio.id,
        aulaId: confirmada.id,
        tipo: 'CONFIRMACAO',
        mensagem: 'Ana Souza confirmou a sua aula de Física.',
        chaveUnica: 'seed:confirmacao:caio',
      },
    ],
  });

  console.log(`Seed concluído. Senha padrão dos usuários: ${senhaPadrao}`);
}

popular()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
