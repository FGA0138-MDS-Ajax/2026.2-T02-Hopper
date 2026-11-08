import request from 'supertest';
import {
  autorizado,
  cadastrarELogar,
  criarAppDeTeste,
  encerrarConexoes,
  limparBanco,
  type UsuarioDeTeste,
} from '../helpers/app';

const { app } = criarAppDeTeste();

let professor: UsuarioDeTeste;
let outroProfessor: UsuarioDeTeste;
let aluno: UsuarioDeTeste;

function emHoras(horas: number): string {
  return new Date(Date.now() + horas * 3_600_000).toISOString();
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
});

afterAll(encerrarConexoes);

describe('grade semanal', () => {
  it('comeca vazia, substitui a grade inteira e devolve ordenada', async () => {
    const vazia = await request(app)
      .get('/api/v1/professores/me/disponibilidade')
      .set(autorizado(professor.token));
    expect(vazia.status).toBe(200);
    expect(vazia.body.faixas).toEqual([]);

    const grade = {
      faixas: [
        { diaSemana: 3, horaInicio: '14:00', horaFim: '18:00' },
        { diaSemana: 1, horaInicio: '08:00', horaFim: '12:00' },
      ],
    };
    const salva = await request(app)
      .put('/api/v1/professores/me/disponibilidade')
      .set(autorizado(professor.token))
      .send(grade);
    expect(salva.status).toBe(200);
    expect(salva.body.faixas.map((faixa: { diaSemana: number }) => faixa.diaSemana)).toEqual([
      1, 3,
    ]);

    const substituida = await request(app)
      .put('/api/v1/professores/me/disponibilidade')
      .set(autorizado(professor.token))
      .send({ faixas: [{ diaSemana: 5, horaInicio: '09:00', horaFim: '10:00' }] });
    expect(substituida.body.faixas).toHaveLength(1);
  });

  it('rejeita faixas sobrepostas com 400 e faixa invalida com 422', async () => {
    const sobrepostas = await request(app)
      .put('/api/v1/professores/me/disponibilidade')
      .set(autorizado(professor.token))
      .send({
        faixas: [
          { diaSemana: 1, horaInicio: '08:00', horaFim: '10:00' },
          { diaSemana: 1, horaInicio: '09:00', horaFim: '11:00' },
        ],
      });
    expect(sobrepostas.status).toBe(400);

    const invalida = await request(app)
      .put('/api/v1/professores/me/disponibilidade')
      .set(autorizado(professor.token))
      .send({ faixas: [{ diaSemana: 1, horaInicio: '10:00', horaFim: '08:00' }] });
    expect(invalida.status).toBe(422);
  });

  it('bloqueia aluno com 403 e visitante com 401', async () => {
    const comoAluno = await request(app)
      .get('/api/v1/professores/me/disponibilidade')
      .set(autorizado(aluno.token));
    expect(comoAluno.status).toBe(403);
    const visitante = await request(app).get('/api/v1/professores/me/disponibilidade');
    expect(visitante.status).toBe(401);
  });
});

describe('bloqueios pontuais', () => {
  it('cria, lista e remove bloqueio', async () => {
    const criado = await request(app)
      .post('/api/v1/professores/me/bloqueios')
      .set(autorizado(professor.token))
      .send({ inicio: emHoras(24), fim: emHoras(26), motivo: 'Consulta' });
    expect(criado.status).toBe(201);
    expect(criado.body.motivo).toBe('Consulta');

    const lista = await request(app)
      .get('/api/v1/professores/me/bloqueios')
      .set(autorizado(professor.token));
    expect(lista.body.itens).toHaveLength(1);

    const remocao = await request(app)
      .delete(`/api/v1/professores/me/bloqueios/${criado.body.id}`)
      .set(autorizado(professor.token));
    expect(remocao.status).toBe(204);
    const depois = await request(app)
      .get('/api/v1/professores/me/bloqueios')
      .set(autorizado(professor.token));
    expect(depois.body.itens).toHaveLength(0);
  });

  it('rejeita bloqueio no passado e intervalo invertido', async () => {
    const passado = await request(app)
      .post('/api/v1/professores/me/bloqueios')
      .set(autorizado(professor.token))
      .send({ inicio: emHoras(-5), fim: emHoras(-3) });
    expect(passado.status).toBe(400);

    const invertido = await request(app)
      .post('/api/v1/professores/me/bloqueios')
      .set(autorizado(professor.token))
      .send({ inicio: emHoras(30), fim: emHoras(28) });
    expect(invertido.status).toBe(422);
  });

  it('impede remover bloqueio de outro professor e responde 404 para id inexistente', async () => {
    const criado = await request(app)
      .post('/api/v1/professores/me/bloqueios')
      .set(autorizado(professor.token))
      .send({ inicio: emHoras(24), fim: emHoras(26) });

    const alheio = await request(app)
      .delete(`/api/v1/professores/me/bloqueios/${criado.body.id}`)
      .set(autorizado(outroProfessor.token));
    expect(alheio.status).toBe(403);

    const inexistente = await request(app)
      .delete('/api/v1/professores/me/bloqueios/11111111-1111-4111-8111-111111111111')
      .set(autorizado(professor.token));
    expect(inexistente.status).toBe(404);
  });
});
