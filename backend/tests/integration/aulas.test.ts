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
import { criarMateria, horario, prepararProfessor } from '../helpers/cenarios';

const { app } = criarAppDeTeste();

let professor: UsuarioDeTeste;
let outroProfessor: UsuarioDeTeste;
let aluno: UsuarioDeTeste;
let outroAluno: UsuarioDeTeste;
let professorId: string;
let materiaId: string;

async function solicitar(
  usuario: UsuarioDeTeste,
  dados: Record<string, unknown> = {},
): Promise<request.Response> {
  return request(app)
    .post('/api/v1/aulas')
    .set(autorizado(usuario.token))
    .send({
      professorId,
      materiaId,
      modalidade: 'ONLINE',
      ...horario(2, 9),
      objetivo: 'Revisão para a prova',
      ...dados,
    });
}

async function solicitarEObterId(
  usuario: UsuarioDeTeste,
  dados: Record<string, unknown> = {},
): Promise<string> {
  const resposta = await solicitar(usuario, dados);
  if (resposta.status !== 201) throw new Error(JSON.stringify(resposta.body));
  return resposta.body.itens[0].id;
}

function aceitar(usuario: UsuarioDeTeste, aulaId: string): request.Test {
  return request(app).patch(`/api/v1/aulas/${aulaId}/aceitar`).set(autorizado(usuario.token));
}

function recusar(
  usuario: UsuarioDeTeste,
  aulaId: string,
  corpo?: Record<string, unknown>,
): request.Test {
  const requisicao = request(app)
    .patch(`/api/v1/aulas/${aulaId}/recusar`)
    .set(autorizado(usuario.token));
  return corpo ? requisicao.send(corpo) : requisicao;
}

beforeEach(async () => {
  await limparBanco();
  professor = await cadastrarELogar(app, {
    nome: 'Prof Ana',
    email: 'ana@exemplo.com',
    perfil: 'PROFESSOR',
  });
  outroProfessor = await cadastrarELogar(app, {
    nome: 'Prof Bruno',
    email: 'bruno@exemplo.com',
    perfil: 'PROFESSOR',
  });
  aluno = await cadastrarELogar(app, {
    nome: 'Aluno Caio',
    email: 'caio@exemplo.com',
    perfil: 'ALUNO',
  });
  outroAluno = await cadastrarELogar(app, {
    nome: 'Aluna Dani',
    email: 'dani@exemplo.com',
    perfil: 'ALUNO',
  });
  const materia = await criarMateria();
  materiaId = materia.id;
  ({ professorId } = await prepararProfessor(app, professor, [materiaId]));
  await prepararProfessor(app, outroProfessor, [materiaId]);
  await prisma.usuario.update({
    where: { id: aluno.id },
    data: { telefone: '61988880001' },
  });
  await prisma.usuario.update({
    where: { id: professor.id },
    data: { telefone: '61988880002' },
  });
});

afterAll(encerrarConexoes);

describe('POST /aulas', () => {
  it('cria a aula como SOLICITADA, grava historico e notifica o professor', async () => {
    const resposta = await solicitar(aluno);

    expect(resposta.status).toBe(201);
    const [aula] = resposta.body.itens;
    expect(aula.status).toBe('SOLICITADA');
    expect(aula.professor.nome).toBe('Prof Ana');
    expect(aula.materia.nome).toBe('Matemática');

    const detalhe = await request(app).get(`/api/v1/aulas/${aula.id}`).set(autorizado(aluno.token));
    expect(detalhe.body.historico).toHaveLength(1);
    expect(detalhe.body.historico[0]).toMatchObject({ status: 'SOLICITADA', autorId: aluno.id });

    const notificacoes = await request(app)
      .get('/api/v1/notificacoes')
      .set(autorizado(professor.token));
    expect(notificacoes.body.naoLidas).toBe(1);
    expect(notificacoes.body.itens[0]).toMatchObject({ tipo: 'SOLICITACAO', aulaId: aula.id });
    expect(notificacoes.body.itens[0].mensagem).toContain('Aluno Caio');
  });

  it('exige login e perfil de aluno', async () => {
    const visitante = await request(app).post('/api/v1/aulas').send({});
    expect(visitante.status).toBe(401);
    const comoProfessor = await solicitar(professor);
    expect(comoProfessor.status).toBe(403);
  });

  it('responde 409 quando o horario esta fora da grade ou bloqueado', async () => {
    const foraDaGrade = await solicitar(aluno, horario(2, 20));
    expect(foraDaGrade.status).toBe(409);
    expect(foraDaGrade.body.erro.codigo).toBe('HORARIO_INDISPONIVEL');

    const bloqueioInicio = horario(3, 9);
    await request(app)
      .post('/api/v1/professores/me/bloqueios')
      .set(autorizado(professor.token))
      .send({ inicio: bloqueioInicio.inicio, fim: bloqueioInicio.fim });
    const bloqueado = await solicitar(aluno, bloqueioInicio);
    expect(bloqueado.status).toBe(409);
  });

  it('rejeita materia ou modalidade que o professor nao oferece com 400', async () => {
    const outraMateria = await criarMateria('Química');
    const materia = await solicitar(aluno, { materiaId: outraMateria.id });
    expect(materia.status).toBe(400);
    expect(materia.body.erro.codigo).toBe('MATERIA_NAO_OFERECIDA');

    const modalidade = await solicitar(aluno, { modalidade: 'DOMICILIO' });
    expect(modalidade.status).toBe(400);
    expect(modalidade.body.erro.codigo).toBe('MODALIDADE_NAO_OFERECIDA');
  });

  it('rejeita aula no passado com 400 e dados invalidos com 422', async () => {
    const passado = await solicitar(aluno, horario(-2, 9));
    expect(passado.status).toBe(400);
    expect(passado.body.erro.codigo).toBe('AULA_NO_PASSADO');

    const invertido = await solicitar(aluno, {
      inicio: horario(2, 10).inicio,
      fim: horario(2, 9).fim,
    });
    expect(invertido.status).toBe(422);
    const longa = await solicitar(aluno, horario(2, 8, 600));
    expect(longa.status).toBe(422);
    const semProfessor = await solicitar(aluno, { professorId: 'abc' });
    expect(semProfessor.status).toBe(422);
  });

  it('responde 404 para professor inexistente ou bloqueado', async () => {
    const inexistente = await solicitar(aluno, {
      professorId: '11111111-1111-4111-8111-111111111111',
    });
    expect(inexistente.status).toBe(404);
    await prisma.usuario.update({ where: { id: professor.id }, data: { ativo: false } });
    const bloqueado = await solicitar(aluno);
    expect(bloqueado.status).toBe(404);
  });
});

describe('GET /aulas', () => {
  it('lista somente as aulas de cada participante', async () => {
    await solicitarEObterId(aluno);
    await solicitarEObterId(outroAluno, horario(3, 9));

    const doAluno = await request(app).get('/api/v1/aulas').set(autorizado(aluno.token));
    expect(doAluno.status).toBe(200);
    expect(doAluno.body.total).toBe(1);
    expect(doAluno.body.itens[0].aluno.id).toBe(aluno.id);

    const doProfessor = await request(app).get('/api/v1/aulas').set(autorizado(professor.token));
    expect(doProfessor.body.total).toBe(2);

    const deOutroProfessor = await request(app)
      .get('/api/v1/aulas')
      .set(autorizado(outroProfessor.token));
    expect(deOutroProfessor.body.total).toBe(0);
  });

  it('filtra por status e periodo e pagina o resultado', async () => {
    const primeira = await solicitarEObterId(aluno, horario(2, 9));
    await solicitarEObterId(aluno, horario(3, 9));
    await solicitarEObterId(aluno, horario(4, 9));
    await aceitar(professor, primeira);

    const confirmadas = await request(app)
      .get('/api/v1/aulas?status=CONFIRMADA')
      .set(autorizado(aluno.token));
    expect(confirmadas.body.total).toBe(1);

    const solicitadas = await request(app)
      .get('/api/v1/aulas?status=SOLICITADA')
      .set(autorizado(aluno.token));
    expect(solicitadas.body.total).toBe(2);

    const periodo = await request(app)
      .get(`/api/v1/aulas?de=${horario(2, 0).inicio}&ate=${horario(3, 23).fim}`)
      .set(autorizado(aluno.token));
    expect(periodo.body.total).toBe(2);

    const paginaUm = await request(app)
      .get('/api/v1/aulas?limite=2&pagina=1')
      .set(autorizado(aluno.token));
    const paginaDois = await request(app)
      .get('/api/v1/aulas?limite=2&pagina=2')
      .set(autorizado(aluno.token));
    expect(paginaUm.body.itens).toHaveLength(2);
    expect(paginaDois.body.itens).toHaveLength(1);
    expect(paginaUm.body.total).toBe(3);
  });

  it('valida os filtros e exige login', async () => {
    const invalido = await request(app)
      .get('/api/v1/aulas?status=QUALQUER')
      .set(autorizado(aluno.token));
    expect(invalido.status).toBe(422);
    const visitante = await request(app).get('/api/v1/aulas');
    expect(visitante.status).toBe(401);
  });
});

describe('GET /aulas/:id', () => {
  it('revela o contato do outro usuario somente depois da confirmacao (RNF06)', async () => {
    const aulaId = await solicitarEObterId(aluno);

    const antes = await request(app).get(`/api/v1/aulas/${aulaId}`).set(autorizado(aluno.token));
    expect(antes.status).toBe(200);
    expect(antes.body.contato).toBeNull();
    expect(JSON.stringify(antes.body)).not.toContain('ana@exemplo.com');

    await aceitar(professor, aulaId);

    const doAluno = await request(app).get(`/api/v1/aulas/${aulaId}`).set(autorizado(aluno.token));
    expect(doAluno.body.contato).toEqual({
      nome: 'Prof Ana',
      email: 'ana@exemplo.com',
      telefone: '61988880002',
    });
    const doProfessor = await request(app)
      .get(`/api/v1/aulas/${aulaId}`)
      .set(autorizado(professor.token));
    expect(doProfessor.body.contato).toEqual({
      nome: 'Aluno Caio',
      email: 'caio@exemplo.com',
      telefone: '61988880001',
    });
  });

  it('nega a quem nao participa, responde 404 e valida o id', async () => {
    const aulaId = await solicitarEObterId(aluno);
    const outro = await request(app)
      .get(`/api/v1/aulas/${aulaId}`)
      .set(autorizado(outroAluno.token));
    expect(outro.status).toBe(403);
    const profOutro = await request(app)
      .get(`/api/v1/aulas/${aulaId}`)
      .set(autorizado(outroProfessor.token));
    expect(profOutro.status).toBe(403);
    const inexistente = await request(app)
      .get('/api/v1/aulas/11111111-1111-4111-8111-111111111111')
      .set(autorizado(aluno.token));
    expect(inexistente.status).toBe(404);
    const invalido = await request(app).get('/api/v1/aulas/abc').set(autorizado(aluno.token));
    expect(invalido.status).toBe(422);
  });
});

describe('PATCH /aulas/:id/aceitar', () => {
  it('confirma a aula, grava historico e notifica o aluno', async () => {
    const aulaId = await solicitarEObterId(aluno);

    const resposta = await aceitar(professor, aulaId);

    expect(resposta.status).toBe(200);
    expect(resposta.body.status).toBe('CONFIRMADA');
    expect(resposta.body.historico.map((item: { status: string }) => item.status)).toEqual([
      'SOLICITADA',
      'CONFIRMADA',
    ]);
    expect(resposta.body.historico[1].autorId).toBe(professor.id);

    const notificacoes = await request(app)
      .get('/api/v1/notificacoes')
      .set(autorizado(aluno.token));
    expect(notificacoes.body.itens[0]).toMatchObject({ tipo: 'CONFIRMACAO', aulaId });
  });

  it('so o professor da aula pode confirmar e nao se confirma duas vezes', async () => {
    const aulaId = await solicitarEObterId(aluno);

    expect((await aceitar(aluno, aulaId)).status).toBe(403);
    expect((await aceitar(outroProfessor, aulaId)).status).toBe(403);
    expect((await request(app).patch(`/api/v1/aulas/${aulaId}/aceitar`)).status).toBe(401);

    expect((await aceitar(professor, aulaId)).status).toBe(200);
    const repetida = await aceitar(professor, aulaId);
    expect(repetida.status).toBe(400);
    expect(repetida.body.erro.codigo).toBe('TRANSICAO_INVALIDA');
    expect((await aceitar(professor, '11111111-1111-4111-8111-111111111111')).status).toBe(404);
  });

  it('remove o horario confirmado da lista de horarios livres', async () => {
    const aulaId = await solicitarEObterId(aluno);
    const antes = await request(app).get(`/api/v1/professores/${professorId}`);
    const horarioDaAula = horario(2, 9).inicio;
    expect(antes.body.horariosLivres.map((item: { inicio: string }) => item.inicio)).toContain(
      horarioDaAula,
    );

    await aceitar(professor, aulaId);

    const depois = await request(app).get(`/api/v1/professores/${professorId}`);
    expect(depois.body.horariosLivres.map((item: { inicio: string }) => item.inicio)).not.toContain(
      horarioDaAula,
    );
    const novaSolicitacao = await solicitar(outroAluno);
    expect(novaSolicitacao.status).toBe(409);
  });

  it('permite aulas consecutivas, pois o intervalo e semiaberto', async () => {
    const primeira = await solicitarEObterId(aluno, horario(2, 9));
    const segunda = await solicitarEObterId(outroAluno, horario(2, 10));
    expect((await aceitar(professor, primeira)).status).toBe(200);
    expect((await aceitar(professor, segunda)).status).toBe(200);
  });
});

describe('conflito de horario (CT05, RF12)', () => {
  it('ao confirmar uma aula, recusa o outro pedido do mesmo horario e avisa o aluno', async () => {
    const primeira = await solicitarEObterId(aluno);
    const segunda = await solicitarEObterId(outroAluno);

    expect((await aceitar(professor, primeira)).status).toBe(200);

    const estado = await prisma.aula.findUniqueOrThrow({ where: { id: segunda } });
    expect(estado.status).toBe('RECUSADA');
    const historico = await prisma.historicoStatus.findFirstOrThrow({
      where: { aulaId: segunda, status: 'RECUSADA' },
    });
    expect(historico.motivo).toBe('O horário foi preenchido por outra aula');
    const avisos = await prisma.notificacao.findMany({ where: { usuarioId: outroAluno.id } });
    expect(avisos.map((aviso) => aviso.tipo)).toEqual(['RECUSA']);
    // O pedido recusado não pode mais ser confirmado.
    const tentativa = await aceitar(professor, segunda);
    expect(tentativa.status).toBe(400);
    expect(tentativa.body.erro.codigo).toBe('TRANSICAO_INVALIDA');
  });

  it('aceita apenas uma de duas confirmacoes simultaneas do mesmo horario', async () => {
    const primeira = await solicitarEObterId(aluno);
    const segunda = await solicitarEObterId(outroAluno);

    const respostas = await Promise.all([
      aceitar(professor, primeira),
      aceitar(professor, segunda),
    ]);

    const status = respostas.map((resposta) => resposta.status).sort();
    expect(status).toEqual([200, 409]);
    const confirmadas = await prisma.aula.count({
      where: { professorId, status: 'CONFIRMADA' },
    });
    expect(confirmadas).toBe(1);
    // O pedido que perdeu a disputa foi recusado pelo aceite vencedor.
    const recusadas = await prisma.aula.count({ where: { professorId, status: 'RECUSADA' } });
    expect(recusadas).toBe(1);
  });

  it('o banco recusa duas aulas confirmadas sobrepostas mesmo fora da API', async () => {
    const primeira = await solicitarEObterId(aluno, horario(2, 9));
    const segunda = await solicitarEObterId(outroAluno, horario(2, 9, 90));
    await prisma.aula.update({ where: { id: primeira }, data: { status: 'CONFIRMADA' } });
    await expect(
      prisma.aula.update({ where: { id: segunda }, data: { status: 'CONFIRMADA' } }),
    ).rejects.toBeDefined();
  });
});

describe('PATCH /aulas/:id/recusar', () => {
  it('recusa com motivo, grava historico, notifica o aluno e libera o horario', async () => {
    const aulaId = await solicitarEObterId(aluno);

    const resposta = await recusar(professor, aulaId, { motivo: 'Estarei viajando' });

    expect(resposta.status).toBe(200);
    expect(resposta.body.status).toBe('RECUSADA');
    expect(resposta.body.historico[1]).toMatchObject({
      status: 'RECUSADA',
      motivo: 'Estarei viajando',
      autorId: professor.id,
    });
    const notificacoes = await request(app)
      .get('/api/v1/notificacoes')
      .set(autorizado(aluno.token));
    expect(notificacoes.body.itens[0].tipo).toBe('RECUSA');
    expect(notificacoes.body.itens[0].mensagem).toContain('Estarei viajando');
    expect((await solicitar(outroAluno)).status).toBe(201);
  });

  it('recusa sem corpo, nao repete a recusa e respeita as permissoes', async () => {
    const aulaId = await solicitarEObterId(aluno);

    expect((await recusar(aluno, aulaId)).status).toBe(403);
    expect((await recusar(outroProfessor, aulaId)).status).toBe(403);
    expect((await recusar(professor, aulaId)).status).toBe(200);
    const repetida = await recusar(professor, aulaId);
    expect(repetida.status).toBe(400);
    expect(repetida.body.erro.codigo).toBe('TRANSICAO_INVALIDA');
    const invalido = await recusar(professor, aulaId, { motivo: '' });
    expect(invalido.status).toBe(422);
  });
});

describe('aulas recorrentes (RF10)', () => {
  it('cria uma serie semanal com o mesmo serieId e notifica o professor uma vez', async () => {
    const resposta = await solicitar(aluno, { recorrencia: { semanas: 3 } });

    expect(resposta.status).toBe(201);
    expect(resposta.body.itens).toHaveLength(3);
    const series = new Set(resposta.body.itens.map((item: { serieId: string }) => item.serieId));
    expect(series.size).toBe(1);
    expect([...series][0]).toEqual(expect.any(String));
    const inicios = resposta.body.itens.map((item: { inicio: string }) =>
      new Date(item.inicio).getTime(),
    );
    expect(inicios[1] - inicios[0]).toBe(7 * 24 * 3_600_000);
    expect(inicios[2] - inicios[1]).toBe(7 * 24 * 3_600_000);

    const notificacoes = await request(app)
      .get('/api/v1/notificacoes')
      .set(autorizado(professor.token));
    expect(notificacoes.body.total).toBe(1);
    expect(notificacoes.body.itens[0].mensagem).toContain('3 aulas semanais');
  });

  it('nao cria nada quando uma das semanas esta indisponivel', async () => {
    const bloqueio = horario(9, 9);
    await request(app)
      .post('/api/v1/professores/me/bloqueios')
      .set(autorizado(professor.token))
      .send(bloqueio);

    const resposta = await solicitar(aluno, { recorrencia: { semanas: 3 } });

    expect(resposta.status).toBe(409);
    expect(resposta.body.erro.codigo).toBe('HORARIO_INDISPONIVEL');
    expect(await prisma.aula.count()).toBe(0);
  });

  it('valida a quantidade de semanas com 422', async () => {
    expect((await solicitar(aluno, { recorrencia: { semanas: 1 } })).status).toBe(422);
    expect((await solicitar(aluno, { recorrencia: { semanas: 13 } })).status).toBe(422);
  });
});

describe('casos complementares do C03 e do C04', () => {
  it('recusa pedido sem professor, matéria, modalidade ou horário e não cria aula (CT04.5)', async () => {
    for (const campo of ['professorId', 'materiaId', 'modalidade', 'inicio', 'fim']) {
      const resposta = await solicitar(aluno, { [campo]: undefined });
      expect(resposta.status, campo).toBe(422);
    }
    expect(await prisma.aula.count()).toBe(0);
  });

  it('recusa aula com menos de 30 minutos e aceita exatamente 30 (CT04.6)', async () => {
    expect((await solicitar(aluno, horario(2, 9, 20))).status).toBe(422);
    expect(await prisma.aula.count()).toBe(0);
    expect((await solicitar(aluno, horario(2, 9, 30))).status).toBe(201);
  });

  it('confirma aulas no mesmo horário com professores diferentes (CT05.3)', async () => {
    const outro = await prisma.perfilProfessor.findUniqueOrThrow({
      where: { usuarioId: outroProfessor.id },
      select: { id: true },
    });
    const primeira = await solicitarEObterId(aluno);
    const segunda = await solicitarEObterId(outroAluno, { professorId: outro.id });

    expect((await aceitar(professor, primeira)).status).toBe(200);
    expect((await aceitar(outroProfessor, segunda)).status).toBe(200);

    const aulas = await prisma.aula.findMany({ select: { status: true } });
    expect(aulas.map((aula) => aula.status)).toEqual(['CONFIRMADA', 'CONFIRMADA']);
  });

  it('desfaz o aceite inteiro quando a gravação da notificação falha (CT06.4)', async () => {
    const aulaId = await solicitarEObterId(aluno);
    const notificacoesAntes = await prisma.notificacao.count();

    // Falha induzida: um gatilho temporário no banco de teste recusa qualquer nova notificação.
    await prisma.$executeRawUnsafe(
      `CREATE OR REPLACE FUNCTION falha_induzida_no_teste() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'falha induzida pelo teste'; END $$ LANGUAGE plpgsql`,
    );
    await prisma.$executeRawUnsafe(
      'CREATE TRIGGER falha_na_notificacao BEFORE INSERT ON "Notificacao" FOR EACH ROW EXECUTE FUNCTION falha_induzida_no_teste()',
    );
    try {
      const resposta = await aceitar(professor, aulaId);
      expect(resposta.status).toBe(500);
    } finally {
      await prisma.$executeRawUnsafe(
        'DROP TRIGGER IF EXISTS falha_na_notificacao ON "Notificacao"',
      );
      await prisma.$executeRawUnsafe('DROP FUNCTION IF EXISTS falha_induzida_no_teste()');
    }

    const aula = await prisma.aula.findUniqueOrThrow({
      where: { id: aulaId },
      select: { status: true, historico: { select: { status: true } } },
    });
    expect(aula.status).toBe('SOLICITADA');
    expect(aula.historico.map((item) => item.status)).toEqual(['SOLICITADA']);
    expect(await prisma.notificacao.count()).toBe(notificacoesAntes);

    // Sem a falha, o mesmo aceite funciona: nada ficou gravado pela metade.
    expect((await aceitar(professor, aulaId)).status).toBe(200);
  });
});
