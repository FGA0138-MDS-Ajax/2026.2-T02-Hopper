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

describe('casos complementares do C02', () => {
  const ROTA_BLOQUEIOS = '/api/v1/professores/me/bloqueios';
  const ID_QUALQUER = '11111111-1111-4111-8111-111111111111';

  it('nega a aluno e a visitante o acesso aos bloqueios (CT03.7)', async () => {
    const corpo = { inicio: emHoras(24), fim: emHoras(26) };
    const comoAluno = [
      await request(app).get(ROTA_BLOQUEIOS).set(autorizado(aluno.token)),
      await request(app).post(ROTA_BLOQUEIOS).set(autorizado(aluno.token)).send(corpo),
      await request(app).delete(`${ROTA_BLOQUEIOS}/${ID_QUALQUER}`).set(autorizado(aluno.token)),
    ];
    expect(comoAluno.map((resposta) => resposta.status)).toEqual([403, 403, 403]);

    const comoVisitante = [
      await request(app).get(ROTA_BLOQUEIOS),
      await request(app).post(ROTA_BLOQUEIOS).send(corpo),
      await request(app).delete(`${ROTA_BLOQUEIOS}/${ID_QUALQUER}`),
    ];
    expect(comoVisitante.map((resposta) => resposta.status)).toEqual([401, 401, 401]);
  });

  it('publicar a grade vazia remove os horários livres do perfil público (CT03.9)', async () => {
    const materia = await criarMateria();
    const { professorId } = await prepararProfessor(app, professor, [materia.id]);
    const antes = await request(app).get(`/api/v1/professores/${professorId}`);
    expect(antes.body.horariosLivres.length).toBeGreaterThan(0);

    const vazia = await request(app)
      .put('/api/v1/professores/me/disponibilidade')
      .set(autorizado(professor.token))
      .send({ faixas: [] });
    expect(vazia.status).toBe(200);

    const depois = await request(app).get(`/api/v1/professores/${professorId}`);
    expect(depois.status).toBe(200);
    expect(depois.body.horariosLivres).toEqual([]);
  });

  it('ao remover um bloqueio, o horário volta a ficar livre (CT03.11)', async () => {
    const materia = await criarMateria();
    const { professorId } = await prepararProfessor(app, professor, [materia.id]);
    const alvo = horario(3, 9);
    const inicioDoAlvo = new Date(alvo.inicio).getTime();
    const inicioDosLivres = async (): Promise<number[]> => {
      const perfil = await request(app).get(`/api/v1/professores/${professorId}`);
      return perfil.body.horariosLivres.map((livre: { inicio: string }) =>
        new Date(livre.inicio).getTime(),
      );
    };
    expect(await inicioDosLivres()).toContain(inicioDoAlvo);

    const bloqueio = await request(app)
      .post(ROTA_BLOQUEIOS)
      .set(autorizado(professor.token))
      .send(alvo);
    expect(bloqueio.status).toBe(201);
    expect(await inicioDosLivres()).not.toContain(inicioDoAlvo);

    const remocao = await request(app)
      .delete(`${ROTA_BLOQUEIOS}/${bloqueio.body.id}`)
      .set(autorizado(professor.token));
    expect(remocao.status).toBe(204);
    expect(await inicioDosLivres()).toContain(inicioDoAlvo);
  });
});
