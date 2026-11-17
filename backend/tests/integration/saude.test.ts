import request from 'supertest';
import { criarAppDeTeste, encerrarConexoes } from '../helpers/app';

const { app } = criarAppDeTeste();

afterAll(encerrarConexoes);

describe('infraestrutura da API', () => {
  it('GET /api/v1/saude informa que o servico esta ativo', async () => {
    const resposta = await request(app).get('/api/v1/saude');
    expect(resposta.status).toBe(200);
    expect(resposta.body.status).toBe('ok');
  });

  it('responde 404 no formato padrao para rotas inexistentes', async () => {
    const resposta = await request(app).get('/api/v1/xyz');
    expect(resposta.status).toBe(404);
    expect(resposta.body.erro.codigo).toBe('ROTA_NAO_ENCONTRADA');
  });

  it('responde 400 para JSON malformado', async () => {
    const resposta = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{invalido');
    expect(resposta.status).toBe(400);
    expect(resposta.body.erro.codigo).toBe('JSON_INVALIDO');
  });

  it('libera CORS apenas para a origem configurada', async () => {
    const permitida = await request(app)
      .get('/api/v1/saude')
      .set('Origin', 'http://localhost:5173');
    const negada = await request(app).get('/api/v1/saude').set('Origin', 'http://malicioso.com');
    expect(permitida.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(negada.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('envia cabecalhos de seguranca do helmet', async () => {
    const resposta = await request(app).get('/api/v1/saude');
    expect(resposta.headers['x-content-type-options']).toBe('nosniff');
    expect(resposta.headers['x-powered-by']).toBeUndefined();
  });
});
