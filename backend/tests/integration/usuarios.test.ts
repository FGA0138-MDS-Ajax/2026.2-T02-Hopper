import request from 'supertest';
import { prisma } from '../../src/infra/prisma';
import {
  autorizado,
  cadastrarELogar,
  criarAppDeTeste,
  encerrarConexoes,
  limparBanco,
  type UsuarioDeTeste,
} from '../helpers/app';

const { app } = criarAppDeTeste();

let professora: UsuarioDeTeste;
let professorIncompleto: UsuarioDeTeste;
let aluno: UsuarioDeTeste;
let matematica: { id: string };
let fisica: { id: string };

const GRADE_TODOS_OS_DIAS = {
  faixas: [0, 1, 2, 3, 4, 5, 6].map((diaSemana) => ({
    diaSemana,
    horaInicio: '08:00',
    horaFim: '12:00',
  })),
};

async function preencherPerfil(usuario: UsuarioDeTeste, materiaIds: string[]): Promise<void> {
  const resposta = await request(app)
    .put('/api/v1/professores/me')
    .set(autorizado(usuario.token))
    .send({
      apresentacao: 'Aulas particulares com foco em resultados',
      valorHora: 85.5,
      modalidades: ['ONLINE', 'PRESENCIAL'],
      materiaIds,
    });
  if (resposta.status !== 200) throw new Error(JSON.stringify(resposta.body));
}

beforeEach(async () => {
  await limparBanco();
  matematica = await prisma.materia.create({ data: { nome: 'Matemática', nivel: 'Médio' } });
  fisica = await prisma.materia.create({ data: { nome: 'Física', nivel: 'Fundamental' } });
  professora = await cadastrarELogar(app, {
    nome: 'Ana Souza',
    email: 'ana@exemplo.com',
    perfil: 'PROFESSOR',
  });
  professorIncompleto = await cadastrarELogar(app, {
    nome: 'Bruno Lima',
    email: 'bruno@exemplo.com',
    perfil: 'PROFESSOR',
  });
  aluno = await cadastrarELogar(app, {
    nome: 'Caio Alves',
    email: 'caio@exemplo.com',
    perfil: 'ALUNO',
  });
});

afterAll(encerrarConexoes);

describe('materias', () => {
  it('lista materias e niveis sem exigir login', async () => {
    const resposta = await request(app).get('/api/v1/materias');
    expect(resposta.status).toBe(200);
    expect(resposta.body.itens.map((item: { nome: string }) => item.nome)).toEqual([
      'Física',
      'Matemática',
    ]);
  });
});

describe('perfil proprio do professor', () => {
  it('comeca incompleto e passa a completo depois de preenchido', async () => {
    const inicial = await request(app)
      .get('/api/v1/professores/me')
      .set(autorizado(professora.token));
    expect(inicial.status).toBe(200);
    expect(inicial.body.completo).toBe(false);

    const atualizado = await request(app)
      .put('/api/v1/professores/me')
      .set(autorizado(professora.token))
      .send({
        apresentacao: 'Professora de exatas',
        valorHora: 90,
        modalidades: ['ONLINE', 'ONLINE'],
        materiaIds: [matematica.id, matematica.id],
      });
    expect(atualizado.status).toBe(200);
    expect(atualizado.body.completo).toBe(true);
    expect(atualizado.body.valorHora).toBe(90);
    expect(atualizado.body.modalidades).toEqual(['ONLINE']);
    expect(atualizado.body.materias).toHaveLength(1);
  });

  it('rejeita materia inexistente com 422 e payload invalido com 422', async () => {
    const inexistente = await request(app)
      .put('/api/v1/professores/me')
      .set(autorizado(professora.token))
      .send({
        apresentacao: 'Texto',
        valorHora: 50,
        modalidades: ['ONLINE'],
        materiaIds: ['11111111-1111-4111-8111-111111111111'],
      });
    expect(inexistente.status).toBe(422);
    expect(inexistente.body.erro.codigo).toBe('MATERIA_INEXISTENTE');

    const invalido = await request(app)
      .put('/api/v1/professores/me')
      .set(autorizado(professora.token))
      .send({ apresentacao: '', valorHora: -1, modalidades: [], materiaIds: [] });
    expect(invalido.status).toBe(422);
  });

  it('bloqueia aluno com 403 e visitante com 401', async () => {
    const comoAluno = await request(app).get('/api/v1/professores/me').set(autorizado(aluno.token));
    expect(comoAluno.status).toBe(403);
    const visitante = await request(app).get('/api/v1/professores/me');
    expect(visitante.status).toBe(401);
  });
});

describe('busca de professores', () => {
  beforeEach(async () => {
    await preencherPerfil(professora, [matematica.id]);
  });

  it('lista somente professores com perfil completo e sem expor e-mail ou telefone', async () => {
    const resposta = await request(app).get('/api/v1/professores');
    expect(resposta.status).toBe(200);
    expect(resposta.body.total).toBe(1);
    expect(resposta.body.pagina).toBe(1);
    const [professor] = resposta.body.itens;
    expect(professor.nome).toBe('Ana Souza');
    expect(professor.valorHora).toBe(85.5);
    expect(professor.email).toBeUndefined();
    expect(professor.telefone).toBeUndefined();
    expect(JSON.stringify(resposta.body)).not.toContain('ana@exemplo.com');
  });

  it('filtra por materia, nivel e modalidade', async () => {
    const porMateria = await request(app).get('/api/v1/professores?materia=matem');
    expect(porMateria.body.total).toBe(1);
    const outraMateria = await request(app).get('/api/v1/professores?materia=fisica');
    expect(outraMateria.body.total).toBe(0);
    const porNivel = await request(app).get('/api/v1/professores?nivel=m%C3%A9dio');
    expect(porNivel.body.total).toBe(1);
    const nivelErrado = await request(app).get(
      '/api/v1/professores?materia=matem&nivel=fundamental',
    );
    expect(nivelErrado.body.total).toBe(0);
    const presencial = await request(app).get('/api/v1/professores?modalidade=PRESENCIAL');
    expect(presencial.body.total).toBe(1);
    const domicilio = await request(app).get('/api/v1/professores?modalidade=DOMICILIO');
    expect(domicilio.body.total).toBe(0);
  });

  it('pagina o resultado e valida os parametros', async () => {
    await preencherPerfil(professorIncompleto, [fisica.id]);
    const primeira = await request(app).get('/api/v1/professores?limite=1&pagina=1');
    expect(primeira.body.itens).toHaveLength(1);
    expect(primeira.body.total).toBe(2);
    const segunda = await request(app).get('/api/v1/professores?limite=1&pagina=2');
    expect(segunda.body.itens).toHaveLength(1);
    expect(segunda.body.itens[0].id).not.toBe(primeira.body.itens[0].id);

    const invalida = await request(app).get('/api/v1/professores?modalidade=XYZ&limite=999');
    expect(invalida.status).toBe(422);
  });

  it('nao lista professor bloqueado pelo administrador', async () => {
    await prisma.usuario.update({ where: { id: professora.id }, data: { ativo: false } });
    const resposta = await request(app).get('/api/v1/professores');
    expect(resposta.body.total).toBe(0);
  });
});

describe('perfil publico do professor', () => {
  it('devolve perfil e horarios livres das proximas semanas sem dados de contato', async () => {
    await preencherPerfil(professora, [matematica.id]);
    await request(app)
      .put('/api/v1/professores/me/disponibilidade')
      .set(autorizado(professora.token))
      .send(GRADE_TODOS_OS_DIAS);
    const lista = await request(app).get('/api/v1/professores');
    const professorId = lista.body.itens[0].id;

    const resposta = await request(app).get(`/api/v1/professores/${professorId}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.nome).toBe('Ana Souza');
    expect(resposta.body.horariosLivres.length).toBeGreaterThan(20);
    expect(resposta.body.horariosLivres[0]).toEqual({
      inicio: expect.any(String),
      fim: expect.any(String),
    });
    expect(JSON.stringify(resposta.body)).not.toContain('ana@exemplo.com');
    expect(resposta.body.telefone).toBeUndefined();
  });

  it('responde 404 para perfil incompleto ou inexistente e 422 para id invalido', async () => {
    const perfil = await prisma.perfilProfessor.findFirstOrThrow({
      where: { usuarioId: professorIncompleto.id },
    });
    const incompleto = await request(app).get(`/api/v1/professores/${perfil.id}`);
    expect(incompleto.status).toBe(404);
    const inexistente = await request(app).get(
      '/api/v1/professores/11111111-1111-4111-8111-111111111111',
    );
    expect(inexistente.status).toBe(404);
    const invalido = await request(app).get('/api/v1/professores/abc');
    expect(invalido.status).toBe(422);
  });
});

describe('dados do proprio usuario', () => {
  it('atualiza nome e telefone', async () => {
    const resposta = await request(app)
      .put('/api/v1/usuarios/me')
      .set(autorizado(aluno.token))
      .send({ nome: 'Caio Alves Jr', telefone: '61988887777' });
    expect(resposta.status).toBe(200);
    expect(resposta.body.nome).toBe('Caio Alves Jr');
    expect(resposta.body.telefone).toBe('61988887777');
    expect(resposta.body.senhaHash).toBeUndefined();

    const limpo = await request(app)
      .put('/api/v1/usuarios/me')
      .set(autorizado(aluno.token))
      .send({ telefone: null });
    expect(limpo.body.telefone).toBeNull();
  });

  it('rejeita corpo vazio com 422 e visitante com 401', async () => {
    const vazio = await request(app)
      .put('/api/v1/usuarios/me')
      .set(autorizado(aluno.token))
      .send({});
    expect(vazio.status).toBe(422);
    const visitante = await request(app).put('/api/v1/usuarios/me').send({ nome: 'Xx' });
    expect(visitante.status).toBe(401);
  });
});
