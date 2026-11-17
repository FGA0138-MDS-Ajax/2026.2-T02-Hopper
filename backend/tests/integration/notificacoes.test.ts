import request from 'supertest';
import {
  autorizado,
  cadastrarELogar,
  criarAppDeTeste,
  encerrarConexoes,
  limparBanco,
  type UsuarioDeTeste,
} from '../helpers/app';
import { criarMateria, horario, prepararProfessor } from '../helpers/cenarios';

const { app } = criarAppDeTeste();

let professor: UsuarioDeTeste;
let aluno: UsuarioDeTeste;
let professorId: string;
let materiaId: string;

async function solicitarAula(diasAFrente: number): Promise<string> {
  const resposta = await request(app)
    .post('/api/v1/aulas')
    .set(autorizado(aluno.token))
    .send({ professorId, materiaId, modalidade: 'ONLINE', ...horario(diasAFrente, 9) });
  if (resposta.status !== 201) throw new Error(JSON.stringify(resposta.body));
  return resposta.body.itens[0].id;
}

function listar(usuario: UsuarioDeTeste, consulta = ''): request.Test {
  return request(app).get(`/api/v1/notificacoes${consulta}`).set(autorizado(usuario.token));
}

beforeEach(async () => {
  await limparBanco();
  professor = await cadastrarELogar(app, {
    nome: 'Prof Ana',
    email: 'ana@exemplo.com',
    perfil: 'PROFESSOR',
  });
  aluno = await cadastrarELogar(app, {
    nome: 'Aluno Caio',
    email: 'caio@exemplo.com',
    perfil: 'ALUNO',
  });
  const materia = await criarMateria();
  materiaId = materia.id;
  ({ professorId } = await prepararProfessor(app, professor, [materiaId]));
});

afterAll(encerrarConexoes);

describe('GET /notificacoes', () => {
  it('comeca vazia e acumula notificacoes a cada mudanca de status', async () => {
    const vazia = await listar(professor);
    expect(vazia.status).toBe(200);
    expect(vazia.body).toEqual({ itens: [], total: 0, pagina: 1, naoLidas: 0 });

    const aulaId = await solicitarAula(2);
    const segundaAula = await solicitarAula(3);
    await request(app).patch(`/api/v1/aulas/${aulaId}/aceitar`).set(autorizado(professor.token));
    await request(app)
      .patch(`/api/v1/aulas/${segundaAula}/recusar`)
      .set(autorizado(professor.token))
      .send({ motivo: 'Sem horário' });

    const doProfessor = await listar(professor);
    expect(doProfessor.body.total).toBe(2);
    expect(
      doProfessor.body.itens.every((item: { tipo: string }) => item.tipo === 'SOLICITACAO'),
    ).toBe(true);

    const doAluno = await listar(aluno);
    expect(doAluno.body.total).toBe(2);
    expect(doAluno.body.naoLidas).toBe(2);
    expect(doAluno.body.itens.map((item: { tipo: string }) => item.tipo).sort()).toEqual([
      'CONFIRMACAO',
      'RECUSA',
    ]);
    expect(doAluno.body.itens[0]).toEqual({
      id: expect.any(String),
      aulaId: expect.any(String),
      tipo: expect.any(String),
      mensagem: expect.any(String),
      lida: false,
      criadoEm: expect.any(String),
    });
  });

  it('pagina, filtra nao lidas e nunca mostra notificacoes de outro usuario', async () => {
    await solicitarAula(2);
    await solicitarAula(3);
    await solicitarAula(4);

    const primeira = await listar(professor, '?limite=2&pagina=1');
    const segunda = await listar(professor, '?limite=2&pagina=2');
    expect(primeira.body.itens).toHaveLength(2);
    expect(segunda.body.itens).toHaveLength(1);
    expect(primeira.body.total).toBe(3);

    await request(app)
      .patch('/api/v1/notificacoes')
      .set(autorizado(professor.token))
      .send({ ids: [primeira.body.itens[0].id] });
    const naoLidas = await listar(professor, '?apenasNaoLidas=true');
    expect(naoLidas.body.total).toBe(2);
    expect(naoLidas.body.naoLidas).toBe(2);

    const doAluno = await listar(aluno);
    expect(doAluno.body.total).toBe(0);
  });

  it('valida os parametros e exige login', async () => {
    expect((await listar(professor, '?apenasNaoLidas=talvez')).status).toBe(422);
    expect((await listar(professor, '?limite=1000')).status).toBe(422);
    expect((await request(app).get('/api/v1/notificacoes')).status).toBe(401);
  });
});

describe('PATCH /notificacoes', () => {
  it('marca ids especificos como lidos', async () => {
    await solicitarAula(2);
    await solicitarAula(3);
    const antes = await listar(professor);
    const [primeira] = antes.body.itens;

    const resposta = await request(app)
      .patch('/api/v1/notificacoes')
      .set(autorizado(professor.token))
      .send({ ids: [primeira.id] });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ atualizadas: 1 });
    const depois = await listar(professor);
    expect(depois.body.naoLidas).toBe(1);
    const marcada = depois.body.itens.find((item: { id: string }) => item.id === primeira.id);
    expect(marcada.lida).toBe(true);

    const repetida = await request(app)
      .patch('/api/v1/notificacoes')
      .set(autorizado(professor.token))
      .send({ ids: [primeira.id] });
    expect(repetida.body).toEqual({ atualizadas: 0 });
  });

  it('marca todas como lidas', async () => {
    await solicitarAula(2);
    await solicitarAula(3);

    const resposta = await request(app)
      .patch('/api/v1/notificacoes')
      .set(autorizado(professor.token))
      .send({ todas: true });

    expect(resposta.body).toEqual({ atualizadas: 2 });
    expect((await listar(professor)).body.naoLidas).toBe(0);
  });

  it('nao altera notificacoes de outro usuario', async () => {
    await solicitarAula(2);
    const [notificacao] = (await listar(professor)).body.itens;

    const resposta = await request(app)
      .patch('/api/v1/notificacoes')
      .set(autorizado(aluno.token))
      .send({ ids: [notificacao.id] });

    expect(resposta.body).toEqual({ atualizadas: 0 });
    expect((await listar(professor)).body.naoLidas).toBe(1);
  });

  it('rejeita corpo invalido com 422 e exige login', async () => {
    const enviar = (corpo: unknown) =>
      request(app)
        .patch('/api/v1/notificacoes')
        .set(autorizado(aluno.token))
        .send(corpo as object);
    expect((await enviar({})).status).toBe(422);
    expect((await enviar({ ids: [], todas: undefined })).status).toBe(422);
    expect((await enviar({ ids: ['x'] })).status).toBe(422);
    expect(
      (await enviar({ ids: ['11111111-1111-4111-8111-111111111111'], todas: true })).status,
    ).toBe(422);
    expect((await request(app).patch('/api/v1/notificacoes').send({ todas: true })).status).toBe(
      401,
    );
  });
});
